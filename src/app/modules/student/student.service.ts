/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import Parents from '../parents/parents.model';
import School from '../school/school.model';
import { createUserWithProfile } from '../user/user.helper';
import { TStudent } from './student.interface';
import Student from './student.model';
import { handleParentUserCreation } from './students.helper';
import User from '../user/user.model';
import generateToken from '../../utils/generateToken';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';

const createStudent = async (
  payload: Partial<TStudent> & { phoneNumber: string; name?: string },
  user: TAuthUser,
) => {
  if (user.role === USER_ROLE.school) {
    const findSchool = await School.findById(user.schoolId);
    payload.schoolId = user.schoolId as any;
    payload.schoolName = findSchool?.schoolName;
  }

  const student = (await createUserWithProfile({
    phoneNumber: payload.phoneNumber,
    role: USER_ROLE.student,
    data: payload,
  })) as any;

  handleParentUserCreation(payload, student);
  return student;
};

const findStudent = async (id: string) => {
  const student = await Student.findById(id);
  if (!student) throw new Error('Student not found');
  return student;
};

const getMyChildren = async (user: TAuthUser) => {
  const result = await Parents.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(String(user.userId)),
      },
    },

    {
      $lookup: {
        from: 'students',
        localField: 'childId',
        foreignField: '_id',
        as: 'student',
      },
    },

    {
      $unwind: {
        path: '$student',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: 'users',
        localField: 'student.userId',
        foreignField: '_id',
        as: 'children',
      },
    },

    {
      $unwind: {
        path: '$children',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        children: 1,
      },
    },
  ]);
  return result;
};

const selectChild = async (id: string) => {
  const findUser = await User.findById(id);

  if (!findUser) {
    throw new Error('User not found');
  }

  const userData = {
    userId: findUser._id,
    studentId: findUser.studentId,
    parentsId: findUser.parentsId,
    schoolId: findUser.schoolId,
    teacherId: findUser.teacherId,
    phoneNumber: findUser.phoneNumber,
    role: findUser.role,
  };

  const tokenGenerate = generateToken(
    userData,
    config.jwt.access_token as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = generateToken(
    userData,
    config.jwt.refresh_token as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return { accessToken: tokenGenerate, refreshToken, user: findUser };
};

export const StudentService = {
  createStudent,
  findStudent,
  getMyChildren,
  selectChild,
};
