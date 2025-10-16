/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';
import { JwtPayload, Secret } from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../../../config';
import sendNotification from '../../../socket/sendNotification';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import { decodeToken } from '../../utils/decodeToken';
import Class from '../class/class.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import Student from '../student/student.model';
import { StudentService } from '../student/student.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { TeacherService } from '../teacher/teacher.service';
import {
  commonStageInAttendance,
  commonStageInAttendanceDetails,
} from './attendance.helper';
import { TAttendance } from './attendance.interface';
import Attendance from './attendance.model';

const createAttendance = async (
  payload: Partial<TAttendance>,
  user: TAuthUser,
) => {
  const findTeacher = await TeacherService.findTeacher(user);

  const findClass = await Class.findOne({
    className: payload.className,
  });

  const totalStudents = await Student.find({
    schoolId: findTeacher.schoolId,
    classId: findClass?._id,
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

  const attendanceDate = new Date();
  attendanceDate.setUTCHours(0, 0, 0, 0);

  const attendance = await Attendance.create({
    ...payload,
    totalStudents,
    presentStudents,
    absentStudents,
    schoolId: findTeacher.schoolId,
    date: attendanceDate,
    isAttendance: true,
  });

  sendNotification(user, {
    senderId: user.userId,
    role: user.role,
    receiverId: user.mySchoolUserId,
    message: `${user.name} has marked attendance for ${payload.className} section ${payload.section}`,
    type: NOTIFICATION_TYPE.ATTENDANCE,
    linkId: attendance._id,
  });

  return attendance;
};

const getAttendanceHistory = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { date } = query;

  // const targetDate = date ? new Date(date as string) : new Date();
  // targetDate.setUTCHours(0, 0, 0, 0);

  // const startOfDay = new Date(targetDate);
  // const endOfDay = new Date(targetDate);
  // endOfDay.setUTCHours(23, 59, 59, 999);

  const matchStage: any = {
    $match: {
      isAttendance: true,
    },
  };

  // if (user.role === USER_ROLE.school) {
  //   matchStage.$match.schoolId = new mongoose.Types.ObjectId(
  //     String(user.schoolId),
  //   );
  // } else {
  //   const findTeacher = await TeacherService.findTeacher(user);
  //   if (!findTeacher) throw new Error('Teacher not found');

  //   matchStage.$match.schoolId = new mongoose.Types.ObjectId(
  //     String(findTeacher.schoolId),
  //   );
  //   matchStage.$match.date = {
  //     $gte: startOfDay,
  //     $lte: endOfDay,
  //   };
  // }

  const attendanceQuery = new AggregationQueryBuilder(query);

  const result = await attendanceQuery
    .customPipeline([
      matchStage,
      ...commonStageInAttendance,
      {
        $project: {
          _id: 1,
          classId: 1,
          className: 1,
          section: 1,
          totalStudents: 1,
          presentStudents: { $size: '$presentStudents' },
          absentStudents: { $size: '$absentStudents' },
          startTime: '$classSchedule.selectTime',
          endTime: '$classSchedule.endTime',
          date: 1,
        },
      },
    ])
    .sort()
    .paginate()
    .execute(Attendance);

  const meta = await attendanceQuery.countTotal(Attendance);

  return { meta, result };
};

const getMyAttendance = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {

  const { token } = query;

  let decodedUser;

  if (token) {
    decodedUser = decodeToken(token as string, config.jwt.access_token as Secret) as JwtPayload;
  }

  if (decodedUser?.role === USER_ROLE.parents) {
    const subscription = await SubscriptionService.getMySubscription(decodedUser as TAuthUser);

    if (Object.keys(subscription || {}).length === 0 || subscription.isAttendanceEnabled === false) {
      throw new AppError(700, 'You need an active subscription to get attendance');
    }
  }


  const findStudent = await StudentService.findStudent(user.studentId);

  const studentObjectId = new mongoose.Types.ObjectId(String(user.studentId));

  const attendanceQuery = new AggregationQueryBuilder(query);
  const commonStage = commonStageInAttendanceDetails(studentObjectId);
  const result = await attendanceQuery
    .customPipeline([
      {
        $match: {
          className: findStudent.className,
          section: findStudent.section,
          schoolId: new mongoose.Types.ObjectId(String(findStudent.schoolId)),
        },
      },
      ...commonStage,
    ])
    .sort()
    .paginate()
    .execute(Attendance);

  const meta = await attendanceQuery.countTotal(Attendance);
  return { meta, result };
};

const getMyAttendanceDetails = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const findStudent = await StudentService.findStudent(user.studentId);
  const dateConvert = new Date(query.date as string);
  const studentObjectId = new mongoose.Types.ObjectId(String(user.studentId));

  const result = await Attendance.aggregate([
    {
      $match: {
        date: dateConvert,
        schoolId: new mongoose.Types.ObjectId(String(findStudent.schoolId)),
      },
    },
    {
      $addFields: {
        status: {
          $cond: {
            if: {
              $in: [
                studentObjectId,
                {
                  $map: {
                    input: '$presentStudents',
                    as: 'student',
                    in: '$$student.studentId',
                  },
                },
              ],
            },
            then: 'present',
            else: 'absent',
          },
        },
      },
    },

    {
      $lookup: {
        from: 'classschedules',
        localField: 'classScheduleId',
        foreignField: '_id',
        as: 'classSchedule',
      },
    },

    {
      $unwind: {
        path: '$classSchedule',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: 'subjects',
        localField: 'classSchedule.subjectId',
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
      $project: {
        _id: 0,
        classScheduleId: 1,
        startTime: '$classSchedule.selectTime',
        subjectName: '$subject.subjectName',
        status: 1,
        date: 1,
      },
    },
  ]);

  return result;
};

const getAttendanceDetails = async (attendanceId: string) => {
  const result = await Attendance.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(attendanceId)),
      },
    },
    ...commonStageInAttendance,

    // Unwind student array to lookup individually
    { $unwind: '$student' },

    // Lookup user info from users collection
    {
      $lookup: {
        from: 'users', // Replace with your actual collection name if different
        localField: 'student.userId',
        foreignField: '_id',
        as: 'userInfo',
      },
    },

    // Flatten userInfo array
    { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },

    // Rebuild the student object with merged user info
    {
      $addFields: {
        student: {
          $mergeObjects: [
            '$student',
            {
              name: '$userInfo.name',
              image: '$userInfo.image',
              email: '$userInfo.email', // optional, add more fields if needed
            },
          ],
        },
      },
    },

    // Re-group back the students into array
    {
      $group: {
        _id: '$_id',
        classId: { $first: '$classId' },
        className: { $first: '$className' },
        section: { $first: '$section' },
        totalStudents: { $first: '$totalStudents' },
        presentStudents: { $first: '$presentStudents' },
        absentStudents: { $first: '$absentStudents' },
        startTime: { $first: '$classSchedule.selectTime' },
        endTime: { $first: '$classSchedule.endTime' },
        date: { $first: '$date' },
        student: { $push: '$student' },
      },
    },

    // Final project
    {
      $project: {
        _id: 1,
        classId: 1,
        className: 1,
        section: 1,
        totalStudents: 1,
        presentStudents: { $size: '$presentStudents' },
        absentStudents: { $size: '$absentStudents' },
        startTime: 1,
        endTime: 1,
        date: 1,
        student: {
          $map: {
            input: '$student',
            as: 'stu',
            in: {
              $mergeObjects: [
                '$$stu',
                {
                  studentId: '$$stu._id',
                  status: {
                    $cond: [
                      {
                        $in: [
                          '$$stu._id',
                          {
                            $map: {
                              input: '$presentStudents',
                              as: 'p',
                              in: '$$p.studentId',
                            },
                          },
                        ],
                      },
                      'present',
                      'absent',
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },
  ]);

  return result;
};

const getAttendanceCount = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const findStudent = await StudentService.findStudent(user.studentId);
  const studentObjectId = new mongoose.Types.ObjectId(String(user.studentId));

  const attendanceQuery = new AggregationQueryBuilder(query);

  // Get the first and last day of the current month
  const startOfMonth = dayjs().startOf('month').toDate();
  const endOfMonth = dayjs().endOf('month').toDate();

  const commonStage = commonStageInAttendanceDetails(studentObjectId);

  const result = await attendanceQuery
    .customPipeline([
      {
        $match: {
          className: findStudent.className,
          section: findStudent.section,
          schoolId: new mongoose.Types.ObjectId(String(findStudent.schoolId)),
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      ...commonStage,
    ])
    .execute(Attendance);

  let totalPresent = 0;
  let totalAbsent = 0;

  for (const attendance of result) {
    totalPresent += attendance.presentClass;
    totalAbsent += attendance.totalClass - attendance.presentClass;
  }

  return {
    totalPresent: totalPresent || 0,
    totalAbsent: totalAbsent || 0,
  };
};

export const AttendanceService = {
  createAttendance,
  getAttendanceHistory,
  getMyAttendance,
  getMyAttendanceDetails,
  getAttendanceDetails,
  getAttendanceCount,
};
