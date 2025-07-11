/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const commonStageInAttendanceDetails = (studentObjectId: any) => [
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
      dateOnly: {
        $dateToString: { format: '%Y-%m-%d', date: '$date' },
      },
    },
  },
  {
    $group: {
      _id: '$dateOnly',
      classInfo: {
        $push: {
          _id: '$_id',
          classScheduleId: '$classScheduleId',
          status: '$status',
          date: '$date',
        },
      },
    },
  },
  {
    $project: {
      _id: 0,
      date: '$_id',
      classInfo: 1,
      totalClass: {
        $size: '$classInfo',
      },
      presentClass: {
        $size: {
          $filter: {
            input: '$classInfo',
            as: 'ci',
            cond: { $eq: ['$$ci.status', 'present'] },
          },
        },
      },
    },
  },
];
