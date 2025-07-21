/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { USER_ROLE } from '../../constant';
import { months, StatisticHelper } from '../../helper/staticsHelper';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Attendance from '../attendance/attendance.model';
import Payment from '../payment/payment.model';
import School from '../school/school.model';
import Student from '../student/student.model';
import Teacher from '../teacher/teacher.model';
import User from './user.model';

const updateUserActions = async (payload: {
  userId: string;
  action: string;
}): Promise<any> => {
  const { userId, action } = payload;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.status === action) {
    throw new AppError(httpStatus.BAD_REQUEST, `User already ${action}`);
  }

  switch (action) {
    case 'blocked':
      user.status = 'blocked';
      await user.save();
      break;
    case 'active':
      user.status = 'active';
      await user.save();
      break;
    default:
      break;
  }

  return user;
};

const getAllCustomers = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    User.find({ role: 'customer' }).populate('profile'),
    query,
  );

  const result = await queryBuilder
    .search(['name', 'email'])
    .filter(['role'])
    .sort()
    .paginate()
    .queryModel.sort();

  const meta = await queryBuilder.countTotal();

  return { meta, result };
};

const createAdmin = async (payload: { phoneNumber: string; name: string }) => {
  const { name, phoneNumber } = payload;
  const uniquePhoneNumber = await UserService.uniquePhoneNumber(phoneNumber);
  if (uniquePhoneNumber) throw new Error('Phone number already exists');

  const user = await User.create({
    phoneNumber,
    role: USER_ROLE.admin,
    name,
  });

  return user;
};

const getAllAdmin = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(User.find({ role: 'admin' }), query);

  const result = await queryBuilder
    .search(['name', 'email'])
    .filter(['name', 'email'])
    .sort()
    .paginate()
    .queryModel.sort();

  const meta = await queryBuilder.countTotal();
  // const result = await User.find({ role: USER_ROLE.admin });
  return { meta, result };
};

const uniquePhoneNumber = async (phoneNumber: string) => {
  const result = await User.findOne({ phoneNumber });
  return result;
};

const countTotal = async (user: TAuthUser) => {
  let returnValue: Record<string, any> = {};

  if (user.role === USER_ROLE.supperAdmin) {
    const [
      totalSchool,
      totalStudent,
      totalTeacher,
      totalParents,
      totalEarning,
    ] = await Promise.all([
      User.countDocuments({ role: USER_ROLE.school }),
      User.countDocuments({ role: USER_ROLE.student }),
      User.countDocuments({ role: USER_ROLE.teacher }),
      User.countDocuments({ role: USER_ROLE.parents }),
      Payment.find({}).then((payments) =>
        payments.reduce((total, payment) => total + payment.amount, 0),
      ),
    ]);

    returnValue = {
      totalSchool,
      totalStudent,
      totalTeacher,
      totalParents,
      totalEarning,
    };
  }

  if (user.role === USER_ROLE.school) {
    const [totalStudent, totalTeacher, attendanceRate] = await Promise.all([
      Student.countDocuments({ schoolId: user.schoolId }),
      Teacher.countDocuments({ schoolId: user.schoolId }),
      Attendance.aggregate([
        {
          $match: {
            schoolId: new mongoose.Types.ObjectId(String(user.schoolId)),
          },
        },
        {
          $project: {
            presentCount: { $size: '$presentStudents' },
            absentCount: { $size: '$absentStudents' },
          },
        },
        {
          $group: {
            _id: null,
            totalPresent: { $sum: '$presentCount' },
            totalAbsent: { $sum: '$absentCount' },
          },
        },
        {
          $project: {
            _id: 0,
            attendanceRate: {
              $cond: [
                { $eq: [{ $add: ['$totalPresent', '$totalAbsent'] }, 0] },
                0,
                {
                  $multiply: [
                    {
                      $divide: [
                        '$totalPresent',
                        { $add: ['$totalPresent', '$totalAbsent'] },
                      ],
                    },
                    100,
                  ],
                },
              ],
            },
          },
        },
      ]),
    ]);

    returnValue = {
      totalStudent,
      totalTeacher,
      attendanceRate: attendanceRate[0] || 0,
    };
  }

  return returnValue;
};

const userOverView = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const year = new Date().getFullYear();
  const { startDate, endDate } = StatisticHelper.statisticHelper(
    year.toString(),
  );

  const result = await User.aggregate([
    {
      $match: {
        role: query.role,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          role: '$role',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.month',
        roles: {
          $push: {
            role: '$_id.role',
            count: '$count',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        roles: 1,
      },
    },
    {
      $sort: {
        month: 1,
      },
    },
  ]);

  const formatted = months.map((month, index) => {
    const monthData = result.find((item) => item.month === index + 1);

    return {
      month,
      total: monthData
        ? monthData.roles.reduce(
            (total: number, role: any) => total + role.count,
            0,
          )
        : 0,
    };
  });

  return formatted;
};

const addParentsMessage = async (payload: {
  studentId: string;
  message: string;
}) => {
  const result = await Student.findOneAndUpdate(
    {
      _id: payload.studentId,
    },
    {
      $set: {
        parentsMessage: payload.message,
      },
    },
    { new: true },
  );

  return result;
};

const getParentsMessage = async (studentId: string) => {
  const result = await Student.findOne({
    _id: studentId,
  }).select('parentsMessage');
  return result;
};

const editProfile = async (user: TAuthUser, payload: any) => {
  const result = await User.findOneAndUpdate(
    { _id: user.userId },
    { $set: payload },
    { new: true },
  );

  const schoolPayload = {
    schoolName: payload.schoolName,
    schoolAddress: payload.schoolAddress,
    adminName: payload.adminName,
    schoolImage: payload.schoolImage,
    coverImage: payload.coverImage,
  };

  if (user.role === USER_ROLE.school) {
    await School.findOneAndUpdate({ userId: user.userId }, schoolPayload, {
      new: true,
    });
  }

  return result;
};

const myProfile = async (user: TAuthUser) => {
  const result = await User.findOne({ _id: user.userId });
  return result;
};

const editAdmin = async (user: TAuthUser, payload: any) => {
  const findUser = await User.findOne({ _id: payload.userId });
  if (!findUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const result = await User.findOneAndUpdate(
    { _id: payload.userId },
    { $set: payload },
    { new: true },
  );
  return result;
};

const deleteAdmin = async (userId: string) => {
  const findUser = await User.findOne({ _id: userId });
  if (!findUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }
  const result = await User.findOneAndDelete({ _id: userId });
  return result;
};

export const UserService = {
  updateUserActions,
  createAdmin,
  getAllCustomers,
  getAllAdmin,
  uniquePhoneNumber,
  countTotal,
  userOverView,
  addParentsMessage,
  getParentsMessage,
  editProfile,
  myProfile,
  editAdmin,
  deleteAdmin,
};
