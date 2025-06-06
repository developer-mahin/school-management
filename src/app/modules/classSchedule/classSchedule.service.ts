import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import { TClassSchedule } from './classSchedule.interface';
import ClassSchedule from './classSchedule.model';
import { commonPipeline } from './classSchedule.helper';

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

  const result = await ClassSchedule.create({
    ...payload,
    schoolId: user.schoolId,
  });
  return result;
};

const getAllClassSchedule = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const classQuery = new AggregationQueryBuilder(query);

  const result = await classQuery
    .customPipeline([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(user.schoolId)),
        },
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'class',
        },
      },
      {
        $unwind: {
          path: '$class',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
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
        $project: {
          section: 1,
          days: 1,
          period: 1,
          selectTime: 1,
          endTime: 1,
          description: 1,
          roomNo: 1,
          date: 1,
          _id: 1,

          className: '$class.className',
          subject: '$subject.subjectName',
          teacherName: '$user.name',
        },
      },
    ])
    .search(['days', 'period', 'section'])
    .paginate()
    .sort()
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

  const result = await scheduleAggregation
    .customPipeline([
      {
        $match: {
          $and: [
            { teacherId: new mongoose.Types.ObjectId(String(user.teacherId)) },
            { days: query.days },
          ],
        },
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'class',
        },
      },
      {
        $unwind: {
          path: '$class',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
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
    .paginate()
    .sort()
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

  const result = await upcomingQuery
    .customPipeline([
      {
        $match: {
          teacherId: new mongoose.Types.ObjectId(String(user.teacherId)),
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
          className: '$class.className',
          levelName: '$class.levelName',
          subjectName: '$subject.subjectName',
          totalStudents: { $size: '$matchedStudents' },
        },
      },
    ])
    .paginate()
    .sort()
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
        _id: new mongoose.Types.ObjectId(String(classScheduleId))
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
            }
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
        totalStudents: { $size: '$matchedStudents' },
        activeStudents: "$matchedStudents",
      },
    },



  ])
  return result[0] || {};
};


export const ClassScheduleService = {
  createClassSchedule,
  getAllClassSchedule,
  updateClassSchedule,
  deleteClassSchedule,
  getClassScheduleByDays,
  getUpcomingClasses,
  getUpcomingClassesByClassScheduleId
};
