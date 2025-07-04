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
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import { stat } from 'fs';

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

  const student = await Student.findOne(findUser.studentId);
  const school = await School.findById(student?.schoolId);

  const userData = {
    userId: findUser._id,
    studentId: findUser.studentId,
    parentsId: findUser.parentsId,
    schoolId: findUser.schoolId,
    teacherId: findUser.teacherId,
    phoneNumber: findUser.phoneNumber,
    role: findUser.role,
    name: findUser.name,
    image: findUser.image,
    mySchoolUserId: school?.userId,
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

  return {
    accessToken: tokenGenerate,
    refreshToken,
    user: findUser,
    mySchoolUserId: school?.userId,
  };
};

const getAllStudents = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const sudentQuery = new AggregationQueryBuilder(query);

  const result = await sudentQuery
    .customPipeline([
      {
        $match: {
          role: USER_ROLE.student,
        },
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          pipeline: [
            {
              $lookup: {
                from: 'schools',
                localField: 'schoolId',
                foreignField: '_id',
                as: 'school',
              },
            },
            {
              $unwind: {
                path: '$school',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          foreignField: 'userId',
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
        $project: {
          student: 1,
          name: 1,
          image: 1,
          status: 1,
          createdAt: 1,
          phoneNumber: 1,
        },
      },
    ])
    .sort()
    .search(['name'])
    .paginate()
    .execute(User);

  const meta = await sudentQuery.countTotal(User);

  return { meta, result };
};

const editStudent = async (id: string, payload: any) => {
  const student = await Student.findById(id);
  if (!student) throw new Error('Student not found');

  const sudentData = {
    schoolId: payload.schoolId,
    classId: payload.classId,
    section: payload.section,
    schoolName: payload.schoolName,
    className: payload.className,
    fatherPhoneNumber: payload.fatherPhoneNumber,
    motherPhoneNumber: payload.motherPhoneNumber,
  };
  const studentUserData = {
    phoneNumber: payload.phoneNumber,
    name: payload.phoneNumber,
  };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updateStudent = await Student.findOneAndUpdate(
      { _id: id },
      sudentData,
      { new: true, session },
    );

    if (!updateStudent) throw new Error('Student not update');

    await User.findOneAndUpdate({ schoolId: id }, studentUserData, {
      new: true,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    return updateStudent;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const deleteStudent = async (id: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const student = await Student.findByIdAndDelete(id, { session });
    if (!student) throw new Error('Student not found');

    await User.findOneAndDelete({ studentId: id }, { session });

    await session.commitTransaction();
    session.endSession();

    return student;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getParentsList = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const parentsListQuery = new AggregationQueryBuilder(query);

  const result = await parentsListQuery
    .customPipeline([
      {
        $match: {
          role: USER_ROLE.parents,
        },
      },
      {
        $lookup: {
          from: 'parents',
          localField: 'parentsId',
          pipeline: [
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
                as: 'studentUser',
              },
            },
            {
              $unwind: {
                path: '$studentUser',
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          foreignField: '_id',
          as: 'parents',
        },
      },

      {
        $unwind: {
          path: '$parents',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'mysubscriptions',
          localField: '_id',
          foreignField: 'userId',
          as: 'subscription',
        },
      },
      {
        $unwind: {
          path: '$subscription',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: 'subscription.subscriptionId',
          foreignField: '_id',
          as: 'subscriptionDetails',
        },
      },
      {
        $unwind: {
          path: '$subscriptionDetails',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          phoneNumber: 1,
          name: 1,
          role: 1,
          status: 1,
          parents: 1,
          subscriptionDetails: 1,
        },
      },
    ])
    .sort()
    .search(['name'])
    .paginate()
    .execute(User);

  const meta = await parentsListQuery.countTotal(User);

  return { meta, result };
};

const getParentsDetails = async (id: string) => {
  const result = await Parents.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(String(id)),
      },
    },

    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'parentsInfo',
      },
    },
    {
      $unwind: {
        path: '$parentsInfo',
        preserveNullAndEmptyArrays: true,
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
        as: 'studentUser',
      },
    },
    {
      $unwind: {
        path: '$studentUser',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        studentName: '$studentUser.name',
        studentClass: '$student.className',
        studentSection: '$student.section',
        studentSchoolName: '$student.schoolName',
        parentsInfo: 1,
      },
    },
  ]);

  return result;
};

export const StudentService = {
  createStudent,
  findStudent,
  getMyChildren,
  selectChild,
  getAllStudents,
  editStudent,
  deleteStudent,
  getParentsList,
  getParentsDetails,
};
