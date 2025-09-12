import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import { classAndSubjectQuery } from '../../helper/aggregationPipline';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import { StudentService } from '../student/student.service';
import { TeacherService } from '../teacher/teacher.service';
import { commonPipeline } from './classSchedule.helper';
import { TClassSchedule } from './classSchedule.interface';
import ClassSchedule from './classSchedule.model';
import { getSchoolIdFromUser } from '../../utils/getSchoolIdForManager';

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

export const ClassScheduleService = {
  createClassSchedule,
  getAllClassSchedule,
  updateClassSchedule,
  deleteClassSchedule,
  getClassScheduleByDays,
  getUpcomingClasses,
  getUpcomingClassesByClassScheduleId,
  getWeeklySchedule,
};
