export const commonStageInAttendance = [
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
      from: 'students',
      localField: 'className',
      foreignField: 'className',
      as: 'student',
    },
  },
];
