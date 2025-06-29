/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import Level from '../level/level.model';
import Student from '../student/student.model';
import { TeacherService } from '../teacher/teacher.service';
import { TClass } from './class.interface';
import Class from './class.model';

const createClass = async (payload: Partial<TClass>, user: TAuthUser) => {
  const findLevel = await Level.findById(payload.levelId);
  if (!findLevel) throw new Error('Level not found');

  const section = payload?.section?.map((item) => item).join(' / ');

  const result = await Class.create({
    ...payload,
    schoolId: user.schoolId,
    levelName: findLevel.levelName,
    section,
  });

  return result;
};

const getAllClasses = async (user: TAuthUser, id: string) => {
  const result = await Class.find({ schoolId: user.schoolId, levelId: id });
  return result;
};

const updateClass = async (id: string, payload: Partial<TClass>) => {
  const section = payload?.section?.map((item) => item).join(' / ');

  const result = await Class.findByIdAndUpdate(
    id,
    { ...payload, section },
    { new: true },
  );
  return result;
};

const deleteClass = async (id: string) => {
  const result = await Class.findByIdAndDelete(id);
  return result;
};

const getClassBySchoolId = async (id: string, user: TAuthUser) => {
  if (user.role === USER_ROLE.school) {
    id = user.schoolId;
  } else if (user.role === USER_ROLE.teacher) {
    const findTeacher = await TeacherService.findTeacher(user);
    id = findTeacher?.schoolId as any;
  }

  const result = await Class.find({ schoolId: id });
  return result;
};

const getSectionsByClassId = async (id: string) => {
  const result = await Class.findById(id);
  const section = result?.section
    ?.map((item) => item.replace(/\s*\/\s*/g, ','))
    .join(',')
    .split(',');

  return section;
};

const getStudentsOfClasses = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { className, section } = query;
  const findTeacher = await TeacherService.findTeacher(user);

  const studentQuery = new AggregationQueryBuilder(query);

  const result = await studentQuery
    .customPipeline([
      {
        $match: {
          $and: [
            {
              schoolId: new mongoose.Types.ObjectId(
                String(findTeacher.schoolId),
              ),
            },
            { className },
            { section },
          ],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
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
          studentId: '$_id',
          studentName: '$user.name',
          userId: '$user._id',
          parentsMessage: 1,
        },
      },
    ])
    .sort()
    .paginate()
    .execute(Student);

  const meta = await studentQuery.countTotal(Student);

  return { meta, result };
};

export const ClassService = {
  createClass,
  getAllClasses,
  updateClass,
  deleteClass,
  getClassBySchoolId,
  getSectionsByClassId,
  getStudentsOfClasses,
};
