import mongoose from 'mongoose';
import ClassSchedule from '../classSchedule/classSchedule.model';

/* eslint-disable @typescript-eslint/no-explicit-any */
const calculateAttendanceRate = (data: any) => {
  let totalPresent = 0;
  let totalAbsent = 0;

  console.log(data);
  data.forEach((entry: any) => {
    const presentCount = entry.attendance?.presentStudents?.length || 0;
    const absentCount = entry.attendance?.absentStudents?.length || 0;

    totalPresent += presentCount;
    totalAbsent += absentCount;
  });

  const total = totalPresent + totalAbsent;

  const rate = total > 0 ? (totalPresent / total) * 100 : 0;

  return {
    attendanceRate: Number(rate.toFixed(2)),
  };
};

const getAttendanceRate = async (
  teacherId: mongoose.Types.ObjectId,
  fromDate: Date,
) => {
  const result = await ClassSchedule.aggregate([
    {
      $match: {
        teacherId,
      },
    },
    {
      $lookup: {
        from: 'attendances',
        localField: '_id',
        foreignField: 'classScheduleId',
        pipeline: [
          {
            $match: {
              date: { $gte: fromDate },
            },
          },
        ],
        as: 'attendance',
      },
    },
    {
      $unwind: {
        path: '$attendance',
        preserveNullAndEmptyArrays: false,
      },
    },
  ]);

  return result;
};

export { calculateAttendanceRate, getAttendanceRate };
