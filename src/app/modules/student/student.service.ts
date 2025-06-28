/* eslint-disable @typescript-eslint/no-explicit-any */
import { Secret } from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../../../config';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import generateToken from '../../utils/generateToken';
import Parents from '../parents/parents.model';
import School from '../school/school.model';
import User from '../user/user.model';
import { TStudent } from './student.interface';
import Student from './student.model';
import {
  createStudentWithProfile,
  handleParentUserCreation,
} from './students.helper';
import generateUID from '../../utils/generateUID';

// const createStudent = async (
//   payload: Partial<TStudent> & { phoneNumber: string; name?: string },
//   user: TAuthUser,
// ) => {
//   if (user.role === USER_ROLE.school) {
//     const findSchool = await School.findById(user.schoolId);
//     payload.schoolId = user.schoolId as any;
//     payload.schoolName = findSchool?.schoolName;
//   }

//   const student = (await createUserWithProfile({
//     phoneNumber: payload.phoneNumber,
//     role: USER_ROLE.student,
//     data: payload,
//   })) as any;

//   handleParentUserCreation(payload, student);
//   return student;
// };

const createStudent = async (
  payload: Partial<TStudent> & { phoneNumber: string; name?: string },
  user: TAuthUser,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (user.role === USER_ROLE.school) {
      const findSchool = await School.findById(user.schoolId);
      payload.schoolId = user.schoolId as any;
      payload.schoolName = findSchool?.schoolName;
    }

    const generateData = {
      className: payload?.className,
      section: payload?.section,
    } as any;
    // Pre-generate all UIDs that might be needed
    const studentUID = await generateUID(generateData);

    const student = (await createStudentWithProfile(
      {
        phoneNumber: payload.phoneNumber,
        data: payload,
        uid: studentUID,
      },
      session,
    )) as any;

    await handleParentUserCreation(
      payload,
      student,
      session,
      // { fatherUID, motherUID } // Pass pre-generated UIDs
    );

    await session.commitTransaction();
    session.endSession();
    return student;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
