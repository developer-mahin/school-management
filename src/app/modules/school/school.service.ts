import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import Teacher from '../teacher/teacher.model';
import { createUserWithProfile } from '../user/user.helper';
import { TSchool } from './school.interface';
import School from './school.model';

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

const getSchoolList = async () => {
  const schools = await School.find({});
  return schools;
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
    .paginate()
    .sort()
    .execute(Teacher);

  const meta = await teachersQuery.countTotal(Teacher);

  return { meta, result };
};

export const SchoolService = {
  createSchool,
  getSchoolList,
  getTeachers,
};
