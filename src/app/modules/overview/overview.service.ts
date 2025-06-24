import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import ClassSchedule from '../classSchedule/classSchedule.model';
import Assignment from '../assignment/assignment.model';

const getTeacherHomePageOverview = async (user: TAuthUser) => {
  const day = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

  const [todaysClass, todaysAttendanceRate, assignmentDue] = await Promise.all([
    ClassSchedule.countDocuments({ teacherId: user.teacherId, days: day }),
    ClassSchedule.aggregate([
      {
        $match: {
          teacherId: new mongoose.Types.ObjectId(String(user.teacherId)),
          days: "monday",
        },
      },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'classScheduleId',
          as: 'attendance',
        }
      },
      {
        $unwind: {
          path: '$attendance',
          preserveNullAndEmptyArrays: true,
        }
      },

      {
        $group: {
          _id: "$_id",
          totalPresent: { $first: "$attendance.presentStudents" },
          totalStudents: { $first: "$attendance.totalStudents" }
        }
      },
      {
        $project: {
          totalStudents: 1,
          totalPresentCount: { $size: { $ifNull: ["$totalPresent", []] } },
          attendanceRate: {
            $cond: [
              { $eq: ["$totalStudents", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: [{ $size: { $ifNull: ["$totalPresent", []] } }, "$totalStudents"] },
                      100
                    ]
                  },
                  2
                ]
              }
            ]
          }
        }
      },
      // New stage: Calculate overall attendance rate
      {
        $group: {
          _id: null,
          totalPresentSum: { $sum: "$totalPresentCount" },
          totalStudentSum: { $sum: "$totalStudents" }
        }
      },
      {
        $project: {
          _id: 0,
          totalPresentSum: 1,
          totalStudentSum: 1,
          overallAttendanceRate: {
            $cond: [
              { $eq: ["$totalStudentSum", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalPresentSum", "$totalStudentSum"] },
                      100
                    ]
                  },
                  2
                ]
              }
            ]
          }
        }
      }
    ]),
    Assignment.countDocuments({ teacherId: user.teacherId, status: { $ne: 'expired' } }),
  ]);

  return {
    todaysClass,
    overallAttendanceRate: todaysAttendanceRate[0]?.overallAttendanceRate || 0,
    activeStudents: todaysAttendanceRate[0]?.totalPresentSum,
    assignmentDue,
  };

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
  getStudentHomePageOverview,
  getParentHomePageOverview,
  getAdminHomePageOverview,
};
