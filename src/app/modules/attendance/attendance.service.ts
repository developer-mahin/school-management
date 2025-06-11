import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Teacher from '../teacher/teacher.model';
import { TAttendance } from './attendance.interface';
import Student from '../student/student.model';
import Attendance from './attendance.model';
import mongoose from 'mongoose';

const createAttendance = async (
  payload: Partial<TAttendance>,
  user: TAuthUser,
) => {
  const findTeacher = await Teacher.findById(user.teacherId);
  if (!findTeacher)
    throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');

  const totalStudents = await Student.find({
    schoolId: findTeacher.schoolId,
    classId: payload.classId,
    className: payload.className,
    section: payload.section,
  }).countDocuments();

  const presentStudents = payload.presentStudents!.map((studentId) => {
    return {
      studentId: studentId,
    };
  });

  const absentStudents = payload.absentStudents!.map((studentId) => {
    return {
      studentId: studentId,
    };
  });

  const attendance = await Attendance.create({
    ...payload,
    totalStudents,
    presentStudents,
    absentStudents,
    schoolId: findTeacher.schoolId,
    date: new Date(),
  });

  return attendance;
};

const getAttendanceHistory = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { date } = query;

  const findTeacher = await Teacher.findById(user.teacherId);
  if (!findTeacher)
    throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');

  const startOfDay = new Date(date as string);
  startOfDay.setUTCHours(0, 0, 0, 0); // 00:00:00.000

  const endOfDay = new Date(date as string);
  endOfDay.setUTCHours(23, 59, 59, 999); // 23:59:59.999

  const result = await Attendance.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(String(findTeacher.schoolId)),
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
    {
      $project: {
        _id: 0,
        classId: 1,
        className: 1,
        section: 1,
        totalStudents: 1,
        presentStudents: {
          $size: '$presentStudents',
        },
        absentStudents: {
          $size: '$absentStudents',
        },
        date: 1,
      },
    },
  ]);

  return result;
};

export const AttendanceService = {
  createAttendance,
  getAttendanceHistory,
};
