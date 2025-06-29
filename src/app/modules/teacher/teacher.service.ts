/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import School from '../school/school.model';
import { createUserWithProfile } from '../user/user.helper';
import { TTeacher } from './teacher.interface';
import Teacher from './teacher.model';
import { StudentService } from '../student/student.service';
import ClassSchedule from '../classSchedule/classSchedule.model';
import mongoose from 'mongoose';

const createTeacher = async (
  payload: Partial<TTeacher> & { phoneNumber: string; name?: string },
  user: TAuthUser,
) => {
  if (user.role === USER_ROLE.school) {
    const findSchool = await School.findById(user.schoolId);
    if (!findSchool)
      throw new AppError(httpStatus.NOT_FOUND, 'School not found');
    payload.schoolName = findSchool?.schoolName;
    payload.schoolId = findSchool._id as any;
  }

  const teacher = await createUserWithProfile({
    phoneNumber: payload.phoneNumber,
    role: USER_ROLE.teacher,
    data: payload,
  });

  return teacher;
};

const findTeacher = async (user: TAuthUser) => {
  const findTeacher = await Teacher.findById(user.teacherId);
  if (!findTeacher)
    throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');
  return findTeacher;
};

const getBaseOnStudent = async (user: TAuthUser) => {
  const findStudent = await StudentService.findStudent(user.studentId);
  if (!findStudent)
    throw new AppError(httpStatus.NOT_FOUND, 'Student not found');


  const result = await ClassSchedule.aggregate([
    {
      $match: {
        classId: new mongoose.Types.ObjectId(String(findStudent.classId)),
      },
    },
    {
      $group: {
        _id: "$teacherId",
        teacherId: {$first: "$teacherId"},
      }
    },
    {
      $lookup: {
        from: "teachers",
        localField: "_id",
        foreignField: "_id",
        as: "teacher"
      }
    },
    {
      $unwind: {
        path: "$teacher",
        preserveNullAndEmptyArrays: true,
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "teacher.userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      }
    },
    {
      $project: {
        // teacher: 1,
        user: 1
      }
    }
  ])

  return result

}

export const TeacherService = {
  createTeacher,
  findTeacher,
  getBaseOnStudent
};
