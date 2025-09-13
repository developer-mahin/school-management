/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import xlsx from 'xlsx';
import { USER_ROLE } from '../../constant';
import { classAndSubjectQuery } from '../../helper/aggregationPipline';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import { getSchoolIdFromUser } from '../../utils/getSchoolIdForManager';
import Class from '../class/class.model';
import { StudentService } from '../student/student.service';
import Subject from '../subject/subject.model';
import { TeacherService } from '../teacher/teacher.service';
import { MulterFile } from '../user/user.controller';
import User from '../user/user.model';
import { commonPipeline } from './classSchedule.helper';
import { TClassSchedule } from './classSchedule.interface';
import ClassSchedule from './classSchedule.model';
import Teacher from '../teacher/teacher.model';

const createClassSchedule = async (
  payload: Partial<TClassSchedule>,
  user: TAuthUser,
) => {
  const findClass = await ClassSchedule.findOne({
    schoolId: user.schoolId,
    teacherId: payload.teacherId,
    days: payload.days,
    period: payload.period,
    section: payload.section,
    selectTime: payload.selectTime,
    endTime: payload.endTime,
  });

  if (findClass) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Class Schedule already exists');
  }

  const schoolId = getSchoolIdFromUser(user);
  const result = await ClassSchedule.create({
    ...payload,
    schoolId,
  });
  return result;
};

const getAllClassSchedule = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const classQuery = new AggregationQueryBuilder(query);
  const schoolId = getSchoolIdFromUser(user);

  const result = await classQuery
    .customPipeline([
      {
        $match: {
          // $expr: {
          schoolId: new mongoose.Types.ObjectId(String(schoolId)),
          // },
        },
      },
      ...classAndSubjectQuery,
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacherId',
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
          from: 'students',
          let: {
            classId: '$classId',
            section: '$section',
            schoolId: new mongoose.Types.ObjectId(String(schoolId)),
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$classId', '$$classId'] },
                    { $eq: ['$section', '$$section'] },
                    { $eq: ['$schoolId', '$$schoolId'] },
                  ],
                },
              },
            },
          ],
          as: 'students', // use plural to indicate array of students
        },
      },
      {
        $project: {
          totalStudent: {
            $size: '$students',
          },
          section: 1,
          days: 1,
          period: 1,
          selectTime: 1,
          endTime: 1,
          description: 1,
          roomNo: 1,
          date: 1,
          _id: 1,
          createdAt: 1,
          className: '$class.className',
          classId: '$class._id',
          subject: '$subject.subjectName',
          subjectId: '$subject._id',
          teacherName: '$user.name',
          teacherId: '$teacher._id',
        },
      },
    ])
    .search(['days', 'period', 'section'])
    .sort()
    .paginate()
    .execute(ClassSchedule);

  const meta = await classQuery.countTotal(ClassSchedule);

  return { meta, result };
};

const updateClassSchedule = async (
  classScheduleId: string,
  payload: Partial<TClassSchedule>,
  user: TAuthUser,
) => {
  const result = await ClassSchedule.findOneAndUpdate(
    { _id: classScheduleId, schoolId: user.schoolId },
    payload,
    {
      new: true,
    },
  );
  return result;
};

const deleteClassSchedule = async (
  classScheduleId: string,
  user: TAuthUser,
) => {
  const result = await ClassSchedule.findOneAndDelete({
    _id: classScheduleId,
    schoolId: user.schoolId,
  });
  return result;
};

const getClassScheduleByDays = async (
  query: Record<string, unknown>,
  user: TAuthUser,
) => {
  const scheduleAggregation = new AggregationQueryBuilder(query);

  const andCondition = [];

  if (user.role === USER_ROLE.teacher) {
    const findTeacher = await TeacherService.findTeacher(user);
    andCondition.push(
      { teacherId: new mongoose.Types.ObjectId(String(user.teacherId)) },
      { schoolId: new mongoose.Types.ObjectId(String(findTeacher?.schoolId)) },
    );
  } else if (user.role === USER_ROLE.student) {
    const findStudent = await StudentService.findStudent(user.studentId);

    andCondition.push(
      { schoolId: new mongoose.Types.ObjectId(String(findStudent.schoolId)) },
      { classId: new mongoose.Types.ObjectId(String(findStudent.classId)) },
      { section: findStudent.section },
    );
  }

  const result = await scheduleAggregation
    .customPipeline([
      {
        $match: {
          $and: [...andCondition, { days: query.days }],
        },
      },
      ...classAndSubjectQuery,
      {
        $project: {
          _id: 1,
          days: 1,
          period: 1,
          selectTime: 1,
          section: 1,
          endTime: 1,
          className: '$class.className',
          subjectName: '$subject.subjectName',
        },
      },
    ])
    .sort()
    .paginate()
    .execute(ClassSchedule);

  const meta = await scheduleAggregation.countTotal(ClassSchedule);
  return { meta, result };
};

const getUpcomingClasses = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { days, nowTime } = query;

  const upcomingQuery = new AggregationQueryBuilder(query);

  let matchStage = {}
  if (user.role === USER_ROLE.teacher) {
    matchStage = {
      teacherId: new mongoose.Types.ObjectId(String(user.teacherId)),
    };
  } else if (user.role === USER_ROLE.student) {
    const findStudent = await StudentService.findStudent(user.studentId);
    matchStage = {
      classId: new mongoose.Types.ObjectId(String(findStudent.classId)),
      section: findStudent.section,
    };
  }

  const result = await upcomingQuery
    .customPipeline([
      {
        $match: {
          ...matchStage,
          days,
          $expr: {
            $gt: ['$selectTime', nowTime],
          },
        },
      },
      ...commonPipeline,
      {
        $lookup: {
          from: 'students',
          let: {
            classId: '$classId',
            section: '$section',
            className: '$class.className',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$classId', '$$classId'] },
                    { $eq: ['$section', '$$section'] },
                    { $eq: ['$className', '$$className'] },
                  ],
                },
              },
            },
          ],
          as: 'matchedStudents',
        },
      },
      {
        $project: {
          _id: 1,
          days: 1,
          period: 1,
          selectTime: 1,
          endTime: 1,
          section: 1,
          teacherName: '$teacher.name',
          className: '$class.className',
          levelName: '$class.levelName',
          subjectName: '$subject.subjectName',
          totalStudents: { $size: '$matchedStudents' },
        },
      },
    ])
    .sort()
    .paginate()
    .execute(ClassSchedule);

  const meta = await upcomingQuery.countTotal(ClassSchedule);

  return { meta, result };
};

const getUpcomingClassesByClassScheduleId = async (
  classScheduleId: string,
  user: TAuthUser,
) => {
  const result = await ClassSchedule.aggregate([
    {
      $match: {
        teacherId: new mongoose.Types.ObjectId(String(user.teacherId)),
        _id: new mongoose.Types.ObjectId(String(classScheduleId)),
      },
    },
    ...commonPipeline,
    {
      $lookup: {
        from: 'students',
        let: {
          classId: '$classId',
          section: '$section',
          className: '$class.className',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$classId', '$$classId'] },
                  { $eq: ['$section', '$$section'] },
                  { $eq: ['$className', '$$className'] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          {
            $unwind: {
              path: '$userInfo',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
        as: 'matchedStudents',
      },
    },
    {
      $project: {
        _id: 1,
        days: 1,
        period: 1,
        selectTime: 1,
        endTime: 1,
        section: 1,
        description: 1,
        className: '$class.className',
        levelName: '$class.levelName',
        subjectName: '$subject.subjectName',
        // totalStudents: { $size: '$matchedStudents' },
        totalStudents: { $size: '$matchedStudents.userInfo' },
        // activeStudents: "$matchedStudents",
        activeStudents: '$matchedStudents',
      },
    },
  ]);
  return result[0] || {};
};

const getWeeklySchedule = async (user: TAuthUser) => {
  let matchStage = {};

  if (user.role === USER_ROLE.teacher) {
    matchStage = {
      teacherId: new mongoose.Types.ObjectId(String(user.teacherId)),
    };
  } else if (user.role === USER_ROLE.student) {
    const findStudent = await StudentService.findStudent(user.studentId);

    matchStage = {
      classId: new mongoose.Types.ObjectId(String(findStudent.classId)),
      section: findStudent.section,
    };
  }

  const result = await ClassSchedule.aggregate([
    {
      $match: {
        ...matchStage,
      },
    },
    ...classAndSubjectQuery,
    {
      $group: {
        _id: '$days',
        schedule: {
          $push: {
            period: '$period',
            selectTime: '$selectTime',
            endTime: '$endTime',
            section: '$section',
            className: '$class.className',
            subjectName: '$subject.subjectName',
          },
        },
      },
    },
  ]);

  return result;
};

const createClassScheduleXlsx = async (file: MulterFile, user: TAuthUser) => {
  const decimalToTime = (decimal: any) => {
    if (!decimal) return '';
    const totalHours = decimal * 24;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Helper function to convert MM-DD-YYYY to Date object
  // Helper function to convert Excel date serial number to JavaScript Date object
  const excelSerialToDate = (serial: any) => {
    if (!serial) return '';
    const excelStartDate = new Date(1900, 0, 1); // Excel's "zero" date is 1900-01-01
    const date = new Date(excelStartDate.getTime() + (serial - 1) * 86400000); // Convert serial to date
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Read the file buffer
  const fileBuffer = fs.readFileSync(file.path);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  // Read sheet as an array of arrays
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
  });

  const [headerRow, ...rows] = rawData as [string[], ...any[]];
  const headers = headerRow.map((header) => header.trim());

  const stringFields = [
    'className',
    'section',
    'subject',
    'period',
    'teacher',
    'selectTime',
    'endTime',
    'days',
    'roomNo',
    'date',
  ];

  const parsedData = rows.map((row) => {
    return headers.reduce(
      (obj, header, index) => {
        let fieldValue = row[index] || ''; // Handle missing values

        fieldValue = fieldValue?.toString().trim(); // Ensure trimming for all fields

        if (typeof fieldValue === 'string') {
          // Remove surrounding quotes and handle quotes inside strings
          if (fieldValue.startsWith('"') && fieldValue.endsWith('"')) {
            fieldValue = fieldValue.slice(1, -1).replace(/""/g, '"'); // Fix double quotes
          }
        }

        // Convert decimal time fields to HH:MM format
        if (header === 'selectTime' || header === 'endTime') {
          obj[header] = decimalToTime(parseFloat(fieldValue)); // Convert the decimal time
        } else if (header === 'date') {
          obj[header] = excelSerialToDate(fieldValue); // Parse and format the date
        } else {
          // Check if the field should be a string or an array
          obj[header] = stringFields.includes(header)
            ? fieldValue
            : fieldValue.includes(',')
              ? fieldValue.split(',').map((item: any) => item.trim()) // Split by comma if multiple values exist
              : fieldValue;
        }

        return obj;
      },
      {} as Record<string, string | string[]>, // Ensure the return type is consistent
    );
  });

  const enrichedData = await Promise.all(
    parsedData.map(async (row) => {
      const classData = await Class.findOne({
        className: row.className,
        schoolId: user.schoolId,
      });

      const subjectData = await Subject.findOne({
        subjectName: row.subject,
        schoolId: user.schoolId,
      });

      const teacherUser = await User.findOne({
        name: row.teacher,
      });

      const teacherData = await Teacher.findOne({
        _id: teacherUser?.teacherId,
        schoolId: user.schoolId,
      });

      if (!teacherData) {
        throw new AppError(httpStatus.BAD_REQUEST, `This ("${row.teacher}") Teacher is not found`);
      }


      return {
        ...row,
        schoolId: user.schoolId,
        classId: classData?._id,
        subjectId: subjectData?._id,
        teacherId: teacherUser?.teacherId,
        date: new Date(row.date as any),
      };
    }),
  );

  // const result = await ClassSchedule.insertMany(enrichedData);
  return enrichedData;
};

export const ClassScheduleService = {
  createClassSchedule,
  getAllClassSchedule,
  updateClassSchedule,
  deleteClassSchedule,
  getClassScheduleByDays,
  getUpcomingClasses,
  getUpcomingClassesByClassScheduleId,
  getWeeklySchedule,
  createClassScheduleXlsx,
};
