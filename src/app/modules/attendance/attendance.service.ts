import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import Student from '../student/student.model';
import { TeacherService } from '../teacher/teacher.service';
import { TAttendance } from './attendance.interface';
import Attendance from './attendance.model';
import Class from '../class/class.model';
import { StudentService } from '../student/student.service';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';

const createAttendance = async (
  payload: Partial<TAttendance>,
  user: TAuthUser,
) => {
  const findTeacher = await TeacherService.findTeacher(user);

  const findClass = await Class.findOne({
    className: payload.className,
  })

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
  });

  return attendance;
};

const getAttendanceHistory = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { date } = query;

  const findTeacher = await TeacherService.findTeacher(user);

  const startOfDay = new Date(date as string);
  startOfDay.setUTCHours(0, 0, 0, 0); // 00:00:00.000

  const endOfDay = new Date(date as string);
  endOfDay.setUTCHours(23, 59, 59, 999); // 23:59:59.999

  const result = await Attendance.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(String(findTeacher.schoolId)),
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
    {
      $project: {
        _id: 0,
        classId: 1,
        className: 1,
        section: 1,
        totalStudents: 1,
        presentStudents: {
          $size: '$presentStudents',
        },
        absentStudents: {
          $size: '$absentStudents',
        },
        date: 1,
      },
    },
  ]);

  return result;
};

const getMyAttendance = async (user: TAuthUser, query: Record<string, unknown>) => {

  const findStudent = await StudentService.findStudent(user.studentId);

  const studentObjectId = new mongoose.Types.ObjectId(String(user.studentId));

  const attendanceQuery = new AggregationQueryBuilder(query);

  const result = await attendanceQuery
    .customPipeline([
      {
        $match: {
          className: findStudent.className,
          section: findStudent.section,
          schoolId: new mongoose.Types.ObjectId(String(findStudent.schoolId)),
        }
      },
      {
        $addFields: {
          status: {
            $cond: {
              if: {
                $in: [studentObjectId, {
                  $map: {
                    input: "$presentStudents",
                    as: "student",
                    in: "$$student.studentId"
                  }
                }]
              },
              then: "present",
              else: "absent"
            }
          },
          dateOnly: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          }
        }
      },
      {
        $group: {
          _id: "$dateOnly",
          classInfo: {
            $push: {
              _id: "$_id",
              classScheduleId: "$classScheduleId",
              status: "$status",
              date: "$date"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          classInfo: 1,
          totalClass: {
            $size: "$classInfo"
          },
          presentClass: {
            $size: {
              $filter: {
                input: "$classInfo",
                as: "ci",
                cond: { $eq: ["$$ci.status", "present"] }
              }
            }
          }
        }
      },
    ])
    .sort()
    .paginate()
    .execute(Attendance)


  const meta = await attendanceQuery.countTotal(Attendance);
  return { meta, result }
};


const getMyAttendanceDetails = async (user: TAuthUser, query: Record<string, unknown>) => {
  const findStudent = await StudentService.findStudent(user.studentId);
  const dateConvert = new Date(query.date as string);
  const studentObjectId = new mongoose.Types.ObjectId(String(user.studentId));


  const result = await Attendance.aggregate([
    {
      $match: {
        date: dateConvert,
        schoolId: new mongoose.Types.ObjectId(String(findStudent.schoolId)),
      }
    },
    {
      $addFields: {
        status: {
          $cond: {
            if: {
              $in: [studentObjectId, {
                $map: {
                  input: "$presentStudents",
                  as: "student",
                  in: "$$student.studentId"
                }
              }]
            },
            then: "present",
            else: "absent"
          }
        },
      }
    },

    {
      $lookup: {
        from: 'classschedules',
        localField: 'classScheduleId',
        foreignField: '_id',
        as: 'classSchedule',
      }
    },

    {
      $unwind: {
        path: '$classSchedule',
        preserveNullAndEmptyArrays: true,
      }
    },

    {
      $lookup: {
        from: 'subjects',
        localField: 'classSchedule.subjectId',
        foreignField: '_id',
        as: 'subject',
      }
    },

    {
      $unwind: {
        path: '$subject',
        preserveNullAndEmptyArrays: true,
      }

    },

    {
      $project: {
        _id: 0,
        classScheduleId: 1,
        startTime: '$classSchedule.selectTime',
        subjectName: '$subject.subjectName',
        status: 1,
        date: 1,
      }
    }

  ])


  return result
}

export const AttendanceService = {
  createAttendance,
  getAttendanceHistory,
  getMyAttendance,
  getMyAttendanceDetails
};
