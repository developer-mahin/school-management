import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import Student from '../student/student.model';
import Teacher from '../teacher/teacher.model';
import { createUserWithProfile } from '../user/user.helper';
import User from '../user/user.model';
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
          createdAt: 1,
          teachers: { $size: '$teachers' },
          students: { $size: '$student' },
          parents: { $size: '$parents' },
        },
      },
    ])
    .search(['name', "school.schoolName"])
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

  console.log(payload, "edit school data");
  console.log(schoolId, "school id");
  const result = await School.findOneAndUpdate({ _id: schoolId }, payload, {
    new: true,
  });
  return result;
};

const deleteSchool = async (schoolId: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await School.findByIdAndDelete(schoolId, { session });

    if (!result) throw new Error('School not deleted');

    await User.findOneAndDelete({ schoolId }, { session });

    await session.commitTransaction();
    session.endSession();

    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllStudents = async (user: TAuthUser, query: Record<string, unknown>) => {
  const studentsQuery = new AggregationQueryBuilder(query);

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)


  const result = await studentsQuery
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
          as: 'userInfo',
        },
      },
      {
        $unwind: {
          path: '$userInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'attendances',
          let: {
            sId: '$schoolId',
            studentId: '$_id', // or '$userId' depending on your schema
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$schoolId', '$$sId'] },
                    { $gte: ['$date', new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)] },
                  ],
                },
              },
            },
            {
              $project: {
                date: 1,
                presentStudents: 1,
                isPresent: {
                  $in: ['$$studentId', '$presentStudents.studentId'],
                },
              },
            },
          ],
          as: 'attendances',
        },
      },
      {
        $addFields: {
          totalClasses: { $size: '$attendances' },
          presentCount: {
            $size: {
              $filter: {
                input: '$attendances',
                as: 'att',
                cond: { $eq: ['$$att.isPresent', true] },
              },
            },
          },
          attendanceRate: {
            $cond: [
              { $eq: [{ $size: '$attendances' }, 0] },
              0,
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$attendances',
                            as: 'att',
                            cond: { $eq: ['$$att.isPresent', true] },
                          },
                        },
                      },
                      { $size: '$attendances' }
                    ]
                  },
                  100
                ]
              }
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'results',
          let: { studentId: '$_id', schoolId: '$schoolId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$schoolId', '$$schoolId'],
                },
              },
            },
            {
              $unwind: '$students',
            },
            {
              $match: {
                $expr: {
                  $eq: ['$students.studentId', '$$studentId'],
                },
              },
            },
            {
              $group: {
                _id: '$students.studentId',
                averageGPA: { $avg: '$students.gpa' },
                totalSubjects: { $sum: 1 },
              },
            },
          ],
          as: 'gpaInfo',
        },
      },
      {
        $addFields: {
          averageGPA: {
            $round: [{ $arrayElemAt: ['$gpaInfo.averageGPA', 0] }, 2],
          },
          totalSubjects: {
            $arrayElemAt: ['$gpaInfo.totalSubjects', 0],
          },
        },
      },

      {
        $project: {
          schoolId: 1,
          averageGPA: 1,
          schoolName: 1,
          className: 1,
          section: 1,
          motherPhoneNumber: 1,
          fatherPhoneNumber: 1,
          createdAt: 1,
          studentName: "$userInfo.name",
          uid: "$userInfo.uid",
          phoneNumber: "$userInfo.phoneNumber",
          image: "$userInfo.image",
          attendanceRate: { $round: ['$attendanceRate', 2] },
        },
      },
    ])
    .execute(Student);


  return result
}

export const SchoolService = {
  createSchool,
  getSchoolList,
  getTeachers,
  editSchool,
  deleteSchool,
  getAllStudents
};
