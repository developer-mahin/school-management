/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { classAndSubjectQuery } from '../../helper/aggregationPipline';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import AssignmentSubmission from '../assignmentSubmission/assignmentSubmission.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import Student from '../student/student.model';
import { StudentService } from '../student/student.service';
import Teacher from '../teacher/teacher.model';
import { TeacherService } from '../teacher/teacher.service';
import { TAssignment, TMarkComplete } from './assignment.interface';
import Assignment from './assignment.model';

const createAssignment = async (
  user: TAuthUser,
  payload: Partial<TAssignment>,
): Promise<TAssignment> => {
  // 1. Validate and fetch teacher data
  const teacher = await TeacherService.findTeacher(user);

  // 2. Validate class and get students
  const classStudents = await Student.find({
    schoolId: teacher.schoolId,
    classId: payload.classId,
    section: payload.section,
  });

  if (!classStudents || classStudents.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No students found in class');
  }

  // 3. Process and normalize due date
  const dueDate = new Date(payload.dueDate as Date);
  dueDate.setUTCHours(23, 59, 59, 999); // Set to end of day

  // 4. Create assignment with normalized data
  const assignmentData = {
    ...payload,
    dueDate,
    schoolId: teacher.schoolId,
    teacherId: user.userId,
  };

  const newAssignment = await Assignment.create(assignmentData);

  // 5. Send notifications in parallel
  const createNotification = async (receiverId: any, message: string) =>
    await sendNotification(user, {
      senderId: user.userId,
      role: user.role,
      receiverId,
      message,
      type: NOTIFICATION_TYPE.ASSIGNMENT,
      linkId: newAssignment._id,
    });

  await Promise.all([
    // Notify all students
    ...classStudents.map((student) =>
      createNotification(
        student.userId,
        `A new assignment has been created for your class: ${payload.title}`,
      ),
    ),
    // Notify school admin
    createNotification(
      user.mySchoolUserId,
      `A new assignment has been created: ${payload.title}`,
    ),
  ]);

  return newAssignment;
};

const getActiveAssignment = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { graded } = query;

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  let matchStage = {};
  if (graded) {
    matchStage = {
      dueDate: {
        $lte: date,
      },
      status: {
        $ne: 'on-going',
      },
    };
  } else {
    matchStage = {
      dueDate: {
        $gte: date,
      },
      status: 'on-going',
    };
  }

  const findTeacher = await TeacherService.findTeacher(user);
  const assignmentQuery = new AggregationQueryBuilder(query);

  const result = await assignmentQuery
    .customPipeline([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(findTeacher.schoolId)),
          ...matchStage,
        },
      },
      ...classAndSubjectQuery,
      {
        $lookup: {
          from: 'assignmentsubmissions',
          localField: '_id',
          foreignField: 'assignmentId',
          as: 'assignmentSubmissions',
        },
      },
      {
        $lookup: {
          from: 'students',
          let: { classId: '$class._id', section: '$section' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$classId', '$$classId'] },
                    { $eq: ['$section', '$$section'] },
                  ],
                },
              },
            },
          ],
          as: 'student',
        },
      },
      {
        $project: {
          classId: 1,
          subjectId: 1,
          section: 1,
          className: '$class.className',
          title: 1,
          fileUrl: 1,
          dueDate: 1,
          status: 1,
          totalStudent: { $size: '$student' },
          totalSubmission: { $size: '$assignmentSubmissions' },
        },
      },
    ])
    .sort()
    .paginate()
    .execute(Assignment);

  const meta = await assignmentQuery.countTotal(Assignment);
  return { meta, result };
};

const getAssignmentDetails = async (
  assignmentId: string,
  query: Record<string, unknown>,
) => {
  const { className: nameOfClass, section: classSection } = query;

  const result = await Assignment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(assignmentId),
      },
    },
    ...classAndSubjectQuery,

    {
      $lookup: {
        from: 'students',
        pipeline: [
          {
            $match: {
              className: nameOfClass,
              section: classSection,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          {
            $unwind: '$userInfo',
          },
          {
            $addFields: {
              studentName: '$userInfo.name',
            },
          },
          {
            $project: {
              studentId: '$_id',
              userId: 1,
              studentName: 1,
              parentsMessage: '$parentsMessage',
            },
          },
        ],
        as: 'students',
      },
    },
    {
      $lookup: {
        from: 'assignmentsubmissions',
        localField: '_id',
        foreignField: 'assignmentId',
        as: 'submissions',
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        className: '$class.className',
        section: 1,
        dueDate: 1,
        marks: 1,
        fileUrl: 1,
        status: 1,
        students: 1,
        submissions: {
          userId: 1,
        },
      },
    },
    {
      $addFields: {
        students: {
          $map: {
            input: '$students',
            as: 'student',
            in: {
              $mergeObjects: [
                '$$student',
                {
                  isSubmit: {
                    $in: ['$$student.userId', '$submissions.userId'],
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        title: 1,
        className: 1,
        section: 1,
        dueDate: 1,
        marks: 1,
        fileUrl: 1,
        status: 1,
        students: 1,
      },
    },
  ]);

  return result;
};

const markAssignmentAsCompleted = async (
  assignmentId: string,
  payload: TMarkComplete[] | any,
  user: TAuthUser,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Validate teacher
    const teacher = await Teacher.findById(user.teacherId).session(session);
    if (!teacher) {
      throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');
    }

    // Step 2: Update the assignment status
    const updatedAssignment = await Assignment.findOneAndUpdate(
      {
        _id: assignmentId,
        schoolId: teacher.schoolId,
      },
      {
        $set: {
          status: 'completed',
        },
      },
      {
        new: true,
        session,
      },
    );

    if (!updatedAssignment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Assignment not found');
    }

    // Step 3: Update each student's assignment submission in parallel
    await Promise.all([
      payload.map(async (item: any) => {
        // Update the assignment submission
        const updatedSubmission = await AssignmentSubmission.findOneAndUpdate(
          {
            studentId: item.studentId,
            assignmentId, // make sure assignmentId matches to avoid wrong updates
          },
          {
            $set: {
              grade: item.grade,
            },
          },
          {
            new: true,
            session,
          },
        );

        // If submission was updated successfully, send notification
        if (updatedSubmission) {
          await sendNotification(user, {
            senderId: user.userId,
            role: user.role,
            receiverId: item.studentUserId,
            message: `${updatedAssignment.title} is marked as completed you can now see the marks`,
            type: NOTIFICATION_TYPE.ASSIGNMENT,
            linkId: assignmentId,
          });
        }

        return updatedSubmission;
      }),

      sendNotification(user, {
        senderId: user.userId,
        role: user.role,
        receiverId: user.mySchoolUserId,
        message: `${updatedAssignment.title} is marked as completed`,
        type: NOTIFICATION_TYPE.ASSIGNMENT,
        linkId: assignmentId,
      }),
    ]);

    // Step 4: Commit transaction
    await session.commitTransaction();
    session.endSession();

    return updatedAssignment;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error; // bubble up error to be handled elsewhere
  }
};

const pendingAssignment = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { submitted } = query;

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  const findStudent = await StudentService.findStudent(user.studentId);
  const myStudentId = new mongoose.Types.ObjectId(String(user.studentId));
  const pendingAssignmentQuery = new AggregationQueryBuilder(query);

  let matchStage = {};
  if (submitted === 'true') {
    matchStage = {
      'assignmentSubmissions.studentId': { $eq: myStudentId },
    };
  } else {
    matchStage = {
      'assignmentSubmissions.studentId': { $ne: myStudentId },
    };
  }

  const result = await pendingAssignmentQuery
    .customPipeline([
      {
        $match: {
          $and: [
            {
              classId: new mongoose.Types.ObjectId(String(findStudent.classId)),
            },
            {
              schoolId: new mongoose.Types.ObjectId(
                String(findStudent.schoolId),
              ),
            },
            { dueDate: { $gte: date } },
            { status: 'on-going' },
          ],
        },
      },

      {
        $lookup: {
          from: 'assignmentsubmissions',
          localField: '_id',
          foreignField: 'assignmentId',
          as: 'assignmentSubmissions',
        },
      },
      {
        $match: {
          ...matchStage,
        },
      },
      {
        $project: {
          assignmentSubmissions: 0,
        },
      },
    ])
    .sort()
    .paginate()
    .execute(Assignment);

  const meta = await pendingAssignmentQuery.countTotal(Assignment);
  return { meta, result };
};

const myAssignmentDetails = async (assignmentId: string, user: TAuthUser) => {
  const findStudent = await StudentService.findStudent(user.studentId);

  const result = await Assignment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(assignmentId)),
        schoolId: new mongoose.Types.ObjectId(String(findStudent?.schoolId)),
      },
    },
    {
      $lookup: {
        from: 'assignmentsubmissions',
        pipeline: [
          {
            $match: {
              studentId: new mongoose.Types.ObjectId(String(user.studentId)),
              assignmentId: new mongoose.Types.ObjectId(String(assignmentId)),
            },
          },
        ],
        as: 'assignmentSubmissions',
      },
    },
    {
      $unwind: {
        path: '$assignmentSubmissions',
        preserveNullAndEmptyArrays: true,
      },
    },
    ...classAndSubjectQuery,
    {
      $project: {
        className: '$class.className',
        section: 1,
        subject: '$subject.subjectName',
        title: 1,
        dueDate: 1,
        marks: 1,
        status: 1,
        submittedFile: '$assignmentSubmissions.submittedFile',
        assignementGrade: '$assignmentSubmissions.grade',
        assignmentFile: '$fileUrl',
      },
    },
  ]);

  return result[0] || {};
};

const getAllAssignment = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const assignmentQuery = new AggregationQueryBuilder(query);

  const result = await assignmentQuery
    .customPipeline([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(user.schoolId)),
        },
      },
      ...classAndSubjectQuery,
      {
        $project: {
          className: '$class.className',
          section: 1,
          subject: '$subject.subjectName',
          title: 1,
          description: 1,
          dueDate: 1,
          marks: 1,
          status: 1,
          fileUrl: 1,
        },
      },
    ])
    .sort()
    .search(['title'])
    .paginate()
    .execute(Assignment);

  const meta = await assignmentQuery.countTotal(Assignment);

  return { meta, result };
};

export const AssignmentService = {
  createAssignment,
  getActiveAssignment,
  getAssignmentDetails,
  markAssignmentAsCompleted,
  pendingAssignment,
  getAllAssignment,
};
