import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import AssignmentSubmission from '../assignmentSubmission/assignmentSubmission.model';
import { StudentService } from '../student/student.service';
import Teacher from '../teacher/teacher.model';
import { TeacherService } from '../teacher/teacher.service';
import { TAssignment, TMarkComplete } from './assignment.interface';
import Assignment from './assignment.model';
import { classAndSubjectQuery } from '../../helper/aggregationPipline';

const createAssignment = async (
  user: TAuthUser,
  payload: Partial<TAssignment>,
) => {
  const findTeacher = await TeacherService.findTeacher(user);

  const date = new Date(payload.dueDate as Date);
  date.setUTCHours(23, 59, 59, 999); // 23:59:59.999

  payload.dueDate = date;
  const createAssignment = await Assignment.create({
    ...payload,
    schoolId: findTeacher.schoolId,
  });

  return createAssignment;
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

  const findExpired = await Assignment.find({
    dueDate: {
      $lt: date,
    },
  });

  if (findExpired) {
    await Assignment.updateMany(
      {
        dueDate: {
          $lt: date,
        },
      },
      {
        status: 'expired',
      },
    );
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
  payload: TMarkComplete[],
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
    await Promise.all(
      payload.map((item) =>
        AssignmentSubmission.findOneAndUpdate(
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
        ),
      ),
    );

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

const pendingAndSubmittedAssignment = async (
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

export const AssignmentService = {
  createAssignment,
  getActiveAssignment,
  getAssignmentDetails,
  markAssignmentAsCompleted,
  pendingAndSubmittedAssignment,
  myAssignmentDetails,
};
