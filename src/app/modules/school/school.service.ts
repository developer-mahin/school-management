import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import Teacher from '../teacher/teacher.model';
import { createUserWithProfile } from '../user/user.helper';
import { TSchool } from './school.interface';
import School from './school.model';
import User from '../user/user.model';

const createSchool = async (
  payload: Partial<TSchool> & { phoneNumber: string; name?: string },
) => {
  const newSchool = await createUserWithProfile({
    phoneNumber: payload.phoneNumber,
    role: USER_ROLE.school,
    data: payload,
  });

  return newSchool;
};

const getSchoolList = async (query: Record<string, unknown>) => {
  const schoolListQuery = new AggregationQueryBuilder(query);

  const result = await schoolListQuery
    .customPipeline([
      {
        $match: {
          role: USER_ROLE.school,
        },
      },

      {
        $lookup: {
          from: 'schools',
          localField: '_id',
          foreignField: 'userId',
          as: 'school',
        },
      },
      {
        $unwind: {
          path: '$school',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'students',
          localField: 'schoolId',
          foreignField: 'schoolId',
          as: 'student',
        },
      },

      {
        $lookup: {
          from: 'parents',
          localField: 'schoolId',
          pipeline: [
            {
              $group: {
                _id: '$userId',
              },
            },
          ],
          foreignField: 'schoolId',
          as: 'parents',
        },
      },

      {
        $lookup: {
          from: 'teachers',
          localField: 'schoolId',
          foreignField: 'schoolId',
          as: 'teachers',
        },
      },

      {
        $project: {
          _id: 1,
          phoneNumber: 1,
          image: 1,
          school: 1,
          teachers: { $size: '$teachers' },
          students: { $size: '$student' },
          parents: { $size: '$parents' },
        },
      },
    ])
    .sort()
    .paginate()
    .execute(User);

  const meta = await schoolListQuery.countTotal(User);

  return { meta, result };
};

const getTeachers = async (user: TAuthUser, query: Record<string, unknown>) => {
  const teachersQuery = new AggregationQueryBuilder(query);

  const result = await teachersQuery
    .customPipeline([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(user.schoolId)),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
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
        $project: {
          _id: 0,
          uid: '$teacher.uid',
          name: '$teacher.name',
          phoneNumber: '$teacher.phoneNumber',
          role: '$teacher.role',
          status: '$teacher.status',
          image: '$teacher.image',
          teacherId: '$_id',
          userId: '$teacher._id',
          subject: '$subjectName',
        },
      },
    ])
    .search(['name'])
    .sort()
    .paginate()
    .execute(Teacher);

  const meta = await teachersQuery.countTotal(Teacher);

  return { meta, result };
};

const editSchool = async (schoolId: string, payload: Partial<TSchool>) => {
  const result = await School.findOneAndUpdate({ _id: schoolId }, payload, {
    new: true,
  });
  return result;
};

const deleteSchool = async (schoolId: string) => {
  const result = await School.findByIdAndDelete(schoolId);
  await User.findOneAndDelete({ schoolId: schoolId });
  return result;
};

export const SchoolService = {
  createSchool,
  getSchoolList,
  getTeachers,
  editSchool,
  deleteSchool,
};
