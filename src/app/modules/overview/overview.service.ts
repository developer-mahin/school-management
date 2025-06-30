/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { months, StatisticHelper } from '../../helper/staticsHelper';
import { TAuthUser } from '../../interface/authUser';
import Assignment from '../assignment/assignment.model';
import Attendance from '../attendance/attendance.model';
import ClassSchedule from '../classSchedule/classSchedule.model';
import { TeacherService } from '../teacher/teacher.service';
import { calculateAttendanceRate, getAttendanceRate } from './overview.helper';

const getTeacherHomePageOverview = async (user: TAuthUser) => {
  const day = new Date()
    .toLocaleString('en-US', { weekday: 'long' })
    .toLowerCase();

  const [todaysClass, todaysAttendanceRate, assignmentDue] = await Promise.all([
    ClassSchedule.countDocuments({ teacherId: user.teacherId, days: day }),
    ClassSchedule.aggregate([
      {
        $match: {
          teacherId: new mongoose.Types.ObjectId(String(user.teacherId)),
          days: day,
        },
      },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'classScheduleId',
          as: 'attendance',
        },
      },
      {
        $unwind: {
          path: '$attendance',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: '$_id',
          totalPresent: { $first: '$attendance.presentStudents' },
          totalStudents: { $first: '$attendance.totalStudents' },
        },
      },
      {
        $project: {
          totalStudents: 1,
          totalPresentCount: { $size: { $ifNull: ['$totalPresent', []] } },
          attendanceRate: {
            $cond: [
              { $eq: ['$totalStudents', 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $size: { $ifNull: ['$totalPresent', []] } },
                          '$totalStudents',
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },
      // New stage: Calculate overall attendance rate
      {
        $group: {
          _id: null,
          totalPresentSum: { $sum: '$totalPresentCount' },
          totalStudentSum: { $sum: '$totalStudents' },
        },
      },
      {
        $project: {
          _id: 0,
          totalPresentSum: 1,
          totalStudentSum: 1,
          overallAttendanceRate: {
            $cond: [
              { $eq: ['$totalStudentSum', 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$totalPresentSum', '$totalStudentSum'] },
                      100,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },
    ]),

    Assignment.countDocuments({
      teacherId: user.teacherId,
      status: { $ne: 'expired' },
    }),
  ]);

  return {
    todaysClass,
    overallAttendanceRate: todaysAttendanceRate[0]?.overallAttendanceRate || 0,
    activeStudents: todaysAttendanceRate[0]?.totalPresentSum || 0,
    assignmentDue,
  };
};

const getDailyWeeklyMonthlyAttendanceRate = async (user: TAuthUser) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Start of today in UTC

  const startOfWeek = new Date(today);
  startOfWeek.setUTCDate(today.getUTCDate() - today.getUTCDay()); // Start from Sunday
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const startOfMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  ); // First of the month in UTC

  const teacherId = new mongoose.Types.ObjectId(String(user.teacherId));

  const [daily, weekly, monthly] = await Promise.all([
    getAttendanceRate(teacherId, today),
    getAttendanceRate(teacherId, startOfWeek),
    getAttendanceRate(teacherId, startOfMonth),
  ]);

  const dailyAttendanceRate = calculateAttendanceRate(daily);
  const weeklyAttendanceRate = calculateAttendanceRate(weekly);
  const monthlyAttendanceRate = calculateAttendanceRate(monthly);

  return {
    dailyAttendanceRate: dailyAttendanceRate?.attendanceRate || 0,
    weeklyAttendanceRate: weeklyAttendanceRate?.attendanceRate || 0,
    monthlyAttendanceRate: monthlyAttendanceRate?.attendanceRate || 0,
  };
};

const getAssignmentCount = async (user: TAuthUser) => {
  const teacher = await TeacherService.findTeacher(user);

  if (!teacher || !teacher._id) {
    throw new Error('Teacher not found or invalid teacher data');
  }

  // Use teacher._id instead of teacher.schoolId for teacherId field
  const schoolId = new mongoose.Types.ObjectId(String(teacher.schoolId));

  // Calculate date for last week
  const lastWeekDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Run both queries in parallel for better performance
  const [activeAssignment, assignmentThisWeek] = await Promise.all([
    Assignment.countDocuments({
      schoolId,
      status: 'on-going',
    }),
    Assignment.countDocuments({
      schoolId,
      dueDate: { $gte: lastWeekDate },
    }),
  ]);

  return {
    activeAssignment: activeAssignment || 0,
    assignmentThisWeek: assignmentThisWeek || 0,
  };
};

const getStudentAttendance = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { year } = query;
  const { startDate, endDate } = StatisticHelper.statisticHelper(
    year as string,
  );

  const attendance = await Attendance.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(String(user.schoolId)),
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $project: {
        month: { $month: '$date' },
        year: { $year: '$date' },
        presentCount: { $size: '$presentStudents' },
      },
    },
    {
      $group: {
        _id: {
          year: '$year',
          month: '$month',
        },
        totalPresent: { $sum: '$presentCount' },
      },
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
      },
    },
  ]);

  const formattedResult = months.map((month, index) => {
    const monthData = attendance.find((r: any) => r._id.month === index + 1);

    return {
      month: month,
      totalPresent: monthData?.totalPresent || 0,
    };
  });

  return formattedResult;
};

const getStudentHomePageOverview = async (user: TAuthUser) => {
  return user;
};

const getParentHomePageOverview = async (user: TAuthUser) => {
  return user;
};

const getAdminHomePageOverview = async (user: TAuthUser) => {
  return user;
};

export const OverviewService = {
  getTeacherHomePageOverview,
  getAssignmentCount,
  getDailyWeeklyMonthlyAttendanceRate,
  getStudentHomePageOverview,
  getParentHomePageOverview,
  getAdminHomePageOverview,
  getStudentAttendance,
};
