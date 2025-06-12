import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Teacher from '../teacher/teacher.model';
import { TAssignment } from './assignment.interface';
import Assignment from './assignment.model';
import mongoose from 'mongoose';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';

const createAssignment = async (
  user: TAuthUser,
  payload: Partial<TAssignment>,
) => {
  const findTeacher = await Teacher.findById(user.teacherId);
  if (!findTeacher)
    throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');

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

  const findTeacher = await Teacher.findById(user.teacherId);
  if (!findTeacher)
    throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  let dueDate;
  if (graded) {
    dueDate = {
      $lte: date,
    };
  } else {
    dueDate = {
      $gte: date,
    };
  }

  const assignmentQuery = new AggregationQueryBuilder(query);

  const result = await assignmentQuery
    .customPipeline([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(findTeacher.schoolId)),
          status: 'on-going',
          dueDate,
        },
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'class',
        },
      },
      {
        $unwind: {
          path: '$class',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
          foreignField: '_id',
          as: 'subject',
        },
      },
      {
        $unwind: {
          path: '$subject',
          preserveNullAndEmptyArrays: true,
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
          totalStudent: { $size: '$student' },
          totalSubmission: { $size: '$assignmentSubmissions' },
        },
      },
    ])
    .paginate()
    .sort()
    .execute(Assignment);

  const meta = await assignmentQuery.countTotal(Assignment);
  return { meta, result };
};

const getAssignmentDetails = async (assignmentId: string) => {

  const result = await Assignment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(assignmentId) // match specific assignment
      }
    },
    {
      $lookup: {
        from: "assignmentsubmissions",
        localField: "_id",
        foreignField: "assignmentId",
        as: "submissions"
      }
    },
    {
      $unwind: "$submissions"
    },
    {
      $lookup: {
        from: "users", // or "students", depending on your schema
        localField: "submissions.userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $addFields: {
        "submissions.studentName": "$user.name" // or any other field like email
      }
    },
    {
      $group: {
        _id: "$_id",
        section: { $first: "$section" },
        title: { $first: "$title" },
        dueDate: { $first: "$dueDate" },
        marks: { $first: "$marks" },
        fileUrl: { $first: "$fileUrl" },
        status: { $first: "$status" },
        submissions: {
          $push: {
            grade: "$submissions.grade",
            studentName: "$submissions.studentName",
            studentId: "$submissions.studentId",
            userId: "$submissions.userId"
          }
        }
      }
    }
  ]);


  return result
};

export const AssignmentService = {
  createAssignment,
  getActiveAssignment,
  getAssignmentDetails
};
