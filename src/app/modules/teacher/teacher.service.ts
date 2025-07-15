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
import sendNotification from '../../../socket/sendNotification';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import User from '../user/user.model';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import { transactionWrapper } from '../../utils/transactionWrapper';

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

  const message = `New teacher ${payload.name} joined ${new Date().toLocaleTimeString()}`;
  await sendNotification(user, {
    senderId: teacher._id,
    role: user.role,
    receiverId: user.userId,
    message,
    type: NOTIFICATION_TYPE.TEACHER,
    linkId: teacher._id,
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

  const currentUserId = new mongoose.Types.ObjectId(String(user.userId));
  const result = await ClassSchedule.aggregate([
    {
      $match: {
        classId: new mongoose.Types.ObjectId(String(findStudent.classId)),
      },
    },
    {
      $group: {
        _id: '$teacherId',
        teacherId: { $first: '$teacherId' },
      },
    },
    {
      $lookup: {
        from: 'teachers',
        localField: '_id',
        foreignField: '_id',
        as: 'teacher',
      },
    },
    {
      $unwind: {
        path: '$teacher',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'teacher.userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'conversations',
        let: { userId: '$user._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$$userId', '$users'],
              },
            },
          },
        ],
        as: 'conversation',
      },
    },
    {
      $addFields: {
        conversation: {
          $filter: {
            input: '$conversation',
            as: 'conv',
            cond: {
              $in: [currentUserId, '$$conv.users'],
            },
          },
        },
      },
    },
    {
      $unwind: {
        path: '$conversation',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        user: {
          _id: '$user._id',
          name: '$user.name',
          phoneNumber: '$user.phoneNumber',
          image: '$user.image',
          teacherId: '$teacher.teacherId',
          createdAt: '$user.createdAt',
          subjectName: '$teacher.subjectName',
          conversationId: '$conversation._id',
        },
      },
    },
  ]);

  return result;
};

const getTeacherList = async (user: TAuthUser, query: any) => {
  const teacherListQuery = new AggregationQueryBuilder(query);

  const matchStage: any = {};
  if (user.role === 'school') {
    matchStage.schoolId = new mongoose.Types.ObjectId(String(user.schoolId));
  }

  const result = await teacherListQuery
    .customPipeline([
      {
        $match: matchStage, // ✅ Filter teachers by schoolId if role === 'school'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
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
      {
        $project: {
          userId: '$userId',
          subjectName: 1,
          name: '$user.name',
          phoneNumber: '$user.phoneNumber',
          createdAt: '$user.createdAt',
          image: '$user.image',
          status: '$user.status',
          schoolName: '$school.schoolName',
          schoolAddress: '$school.schoolAddress',
        },
      },
    ])
    .search(['name'])
    .sort()
    .paginate()
    .execute(Teacher); // ✅ Now from the Teacher model directly

  const meta = await teacherListQuery.countTotal(Teacher);

  return { meta, result };
};

const editTeacher = async (
  teacherId: string,
  payload: Partial<TTeacher & { phoneNumber: string; name?: string }>,
) => {
  const teacherInfo = {
    schoolId: payload.schoolId,
    schoolName: payload.schoolName,
    subjectId: payload.subjectId,
    subjectName: payload.subjectName,
  };

  const teacherUserInfo = {
    name: payload.name,
    phoneNumber: payload.phoneNumber,
  };

  const data = transactionWrapper(async (session) => {
    const teacher = await Teacher.findOneAndUpdate(
      {
        userId: teacherId,
      },
      {
        $set: teacherInfo,
      },
      {
        new: true,
        session,
      },
    );

    if (!teacher) throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');

    const user = await User.findOneAndUpdate(
      {
        _id: teacherId,
      },
      {
        $set: teacherUserInfo,
      },
      {
        new: true,
        session,
      },
    );

    if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

    return { teacher, user };
  });
  return data;
};

const deleteTeacher = async (teacherId: string) => {
  const result = transactionWrapper(async (session) => {
    const teacher = await Teacher.findOneAndDelete(
      { userId: teacherId },
      { session },
    );
    if (!teacher) throw new Error('Teacher not found');

    const user = await User.findOneAndDelete({ _id: teacherId }, { session });
    if (!user) throw new Error('User not found');
  });

  return result;
};

export const TeacherService = {
  createTeacher,
  findTeacher,
  getBaseOnStudent,
  getTeacherList,
  editTeacher,
  deleteTeacher,
};
