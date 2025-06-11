import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Teacher from '../teacher/teacher.model';
import { TAssignment } from './assignment.interface';
import Assignment from './assignment.model';
import mongoose from 'mongoose';

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

const getActiveAssignment = async (user: TAuthUser) => {
  const findTeacher = await Teacher.findById(user.teacherId);
  if (!findTeacher)
    throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');

  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);

  const result = await Assignment.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(String(findTeacher.schoolId)),
        status: 'on-going',
        dueDate: {
          $gte: date,
        },
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
  ]);

  return result;
};

export const AssignmentService = {
  createAssignment,
  getActiveAssignment,
};
