/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../../config';
import sendNotification from '../../../socket/sendNotification';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { JOB_STATUS, USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import generateUID from '../../utils/generateUID';
import Company from '../company/company.model';
import JobRequest from '../jobRequest/jobRequest.model';
import MySubscription from '../mySubscription/mySubscription.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import Profile from '../profile/profile.model';
import User from './user.model';
import { StatisticHelper } from '../../helper/staticsHelper';

const updateUserActions = async (id: string, action: string): Promise<any> => {
  const user = await User.findById(id);
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

const driverPerformance = async (driverId: string): Promise<any> => {
  const maxAllowedResponseTime = 86400; // 24 hours in seconds

  try {
    // Aggregation pipeline to calculate job counts and response time
    const performance = await JobRequest.aggregate([
      {
        $match: {
          driver: new mongoose.Types.ObjectId(String(driverId)),
        },
      },
      {
        $facet: {
          totalJobs: [{ $count: 'total' }],
          completedJobs: [
            { $match: { status: 'completed' } },
            { $count: 'completed' },
          ],
          canceledJobs: [
            { $match: { status: 'cancelled' } },
            { $count: 'cancelled' },
          ],
          responseTimeStats: [
            {
              $match: {
                status: 'completed',
                assignedAt: { $exists: true, $ne: null },
                completedAt: { $exists: true, $ne: null },
              },
            },
            {
              $project: {
                responseTimeInSeconds: {
                  $cond: {
                    if: { $gte: ['$completedAt', '$assignedAt'] },
                    then: {
                      $divide: [
                        { $subtract: ['$completedAt', '$completedAt'] },
                        1000,
                      ],
                    },
                    else: null,
                  },
                },
              },
            },
            {
              $match: { responseTimeInSeconds: { $ne: null } },
            },
            {
              $group: {
                _id: null,
                avgResponseTime: { $avg: '$responseTimeInSeconds' },
                totalCount: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]).exec();

    // Extract results
    const totalJobs = performance[0]?.totalJobs[0]?.total || 0;
    const completedJobs = performance[0]?.completedJobs[0]?.completed || 0;
    const canceledJobs = performance[0]?.canceledJobs[0]?.cancelled || 0;
    const avgResponseTime =
      performance[0]?.responseTimeStats[0]?.avgResponseTime || 0;

    // Calculate completion rate percentage
    const completionRatePercentage =
      totalJobs === 0 ? 0 : (completedJobs / totalJobs) * 100;

    // Calculate response time efficiency (higher is better: faster response = higher score)
    const responseTimeEfficiency =
      avgResponseTime > 0
        ? Math.max(
            0,
            (maxAllowedResponseTime - avgResponseTime) / maxAllowedResponseTime,
          ) * 100
        : 0;

    // Combine completion rate and response time efficiency (50% weight each)
    const performancePercentage =
      0.5 * completionRatePercentage + 0.5 * responseTimeEfficiency;

    // Calculate cancel rate percentage
    const cancelRatePercentage =
      totalJobs === 0 ? 0 : (canceledJobs / totalJobs) * 100;

    return {
      completionRatePercentage: parseFloat(completionRatePercentage.toFixed(2)),
      cancelRatePercentage: parseFloat(cancelRatePercentage.toFixed(2)),
      performancePercentage: parseFloat(performancePercentage.toFixed(2)),
    };
  } catch (error: any) {
    throw new Error(`Failed to calculate driver performance: ${error.message}`);
  }
};

const getAllCustomers = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    User.find({ role: 'customer' }).populate('profile'),
    query,
  );

  const result = await queryBuilder
    .search(['name', 'email'])
    .filter(['role'])
    .paginate()
    .sort()
    .queryModel.sort();

  const meta = await queryBuilder.countTotal();

  return { meta, result };
};

const getAllCompany = async (query: Record<string, unknown>) => {
  const companyAggregation = new AggregationQueryBuilder(query);

  const result = await companyAggregation
    .customPipeline([
      {
        $match: {
          role: 'company',
        },
      },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'myCompany',
          foreignField: 'companyId',
          as: 'payment',
        },
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: {
          'payment.paymentStatus': 'completed',
        },
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          activity: { $first: '$activity' },
          totalAmount: { $sum: '$payment.amount' },
        },
      },

      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: 'companyUserId',
          as: 'company',
        },
      },
      {
        $unwind: {
          path: '$company',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          name: 1,
          totalAmount: 1,
          companyId: '$company._id',
          drivers: '$company.drivers',
          dispatchers: '$company.dispatchers',
        },
      },
    ])
    .search(['name'])
    .paginate()
    .sort()
    .execute(User);

  const dispatched = await JobRequest.aggregate([
    {
      $match: {},
    },
    {
      $group: {
        _id: '$company',
        totalDispatched: {
          $sum: { $cond: [{ $eq: ['$isDispatched', true] }, 1, 0] },
        },
      },
    },
  ]);

  const mergeData = result.map((data: any) => {
    const dispatchedData = dispatched.find(
      (item: any) => item._id.toString() === data.companyId.toString(),
    );

    return {
      _id: data._id.toString(),
      name: data.name || 'N/A',
      companyId: data.companyId.toString(),
      totalAmount: data.totalAmount || 0,
      totalDriver: data.drivers.length || 0,
      totalDispatcher: data.dispatchers.length || 0,
      totalDispatched: dispatchedData?.totalDispatched || 0,
    };
  });

  const meta = await companyAggregation.countTotal(User);

  return { meta, result: mergeData };
};

const companyDetails = async (companyId: string) => {
  const result = await JobRequest.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(String(companyId)),
        status: JOB_STATUS.completed,
      },
    },
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job',
      },
    },
    {
      $unwind: {
        path: '$job',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: 'payments',
        localField: '_id',
        foreignField: 'jobRequestId',
        as: 'payment',
      },
    },
    {
      $unwind: {
        path: '$payment',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $group: {
        _id: '$job.categoryName',
        categoryName: { $first: '$job.categoryName' },
        amountOfCategory: { $sum: '$payment.amount' },
      },
    },

    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amountOfCategory' },
        categories: {
          $push: {
            categoryName: '$categoryName',
            amountOfCategory: '$amountOfCategory',
          },
        },
      },
    },

    {
      $project: {
        _id: 0,
        totalAmount: 1,
        name: '$company.name',
        categories: 1,
      },
    },
  ]);

  const user = await Company.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(companyId)),
      },
    },

    {
      $lookup: {
        from: 'users',
        localField: 'companyUserId',
        foreignField: '_id',
        as: 'companyUser',
      },
    },
    {
      $unwind: {
        path: '$companyUser',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: 'profiles',
        localField: 'profileId',
        foreignField: '_id',
        as: 'profile',
      },
    },
    {
      $unwind: {
        path: '$profile',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: '$companyUser.name',
        email: '$companyUser.email',
        joiningDate: '$companyUser.createdAt',
        image: '$profile.image',
        totalAmount: result[0]?.totalAmount || 0,
        categories: result[0]?.categories || [],
      },
    },
  ]);

  return user;
};

const companyDispatchedHistory = async (
  companyId: string,
  query: Record<string, unknown>,
) => {
  const historyAggregation = new AggregationQueryBuilder(query);

  const result = await historyAggregation
    .customPipeline([
      {
        $match: {
          company: new mongoose.Types.ObjectId(String(companyId)),
          isDispatched: true,
        },
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job',
        },
      },
      {
        $unwind: {
          path: '$job',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          jobId: '$job._id',
          serviceName: '$job.serviceName',
          date: '$job.createdAt',
        },
      },
    ])
    .paginate()
    .sort()
    .execute(JobRequest);

  const meta = await historyAggregation.countTotal(JobRequest);

  return { meta, result };
};

const getAllCompanyRequest = async (query: Record<string, unknown>) => {
  const companyQuery = new QueryBuilder(
    User.find({
      role: 'company',
      isCompleted: true,
      isApproved: false,
    }),
    query,
  );

  const result = await companyQuery
    .paginate()
    .search(['name', 'email'])
    .queryModel.sort();
  const meta = await companyQuery.countTotal();
  return { meta, result };
};

const approveRequest = async (
  user: TAuthUser,
  payload: { userId: string; action: 'accept' | 'cancel' },
) => {
  const { userId, action } = payload;
  let result: any;

  const notificationData = {
    type: NOTIFICATION_TYPE.companyRequest as any,
    senderId: user?.userId as any,
    receiverId: userId as any,
    linkId: result?._id as any,
    role: user?.role,
    message: '',
    data: result,
  };

  switch (action) {
    case 'accept':
      result = await User.findByIdAndUpdate(
        userId,
        { isApproved: true },
        { new: true },
      );
      notificationData.data = result;
      notificationData.message =
        'Your company approval request has been approved';
      break;

    case 'cancel':
      notificationData.data = result;
      notificationData.message =
        'Your company approval request has been rejected';
      break;
    default:
      break;
  }

  await sendNotification(
    { userId: user.userId, role: user.role } as any,
    notificationData,
  );

  return result;
};

const createAdmin = async (payload: { email: string; name: string }) => {
  const { name, email } = payload;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createAdmin = await User.create(
      [
        {
          name,
          email,
          password: config.admin_password,
          uid: await generateUID(),
          role: USER_ROLE.admin,
        },
      ],
      { session, new: true },
    );

    if (!createAdmin) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Dispatcher not created');
    }
    const profile = await Profile.create(
      [
        {
          userId: createAdmin[0]._id,
        },
      ],
      { session, new: true },
    );

    await User.findOneAndUpdate(
      { _id: createAdmin[0]._id },
      { $set: { profile: profile[0]._id } },
      { session, new: true, upsert: true },
    );

    if (!profile) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Profile not created');
    }

    await session.commitTransaction();
    session.endSession();

    return { user: createAdmin[0], profile: profile[0] };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllAdmin = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(User.find({ role: 'admin' }), query);

  const result = await queryBuilder
    .paginate()
    .search(['name', 'email'])
    .filter(['name', 'email'])
    .sort()
    .queryModel.sort();

  const meta = await queryBuilder.countTotal();
  // const result = await User.find({ role: USER_ROLE.admin });
  return { meta, result };
};

const getAllDriverRequest = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const data = new QueryBuilder(
    User.find({
      $and: [
        {
          role: 'driver',
          isCompleted: true,
          isApproved: false,
        },
        {
          assignedCompany: user.myCompany,
        },
      ],
    }),
    query,
  );

  const result = await data
    .paginate()
    .search(['name', 'email'])
    .filter(['name', 'email'])
    .sort()
    .queryModel.sort();

  const meta = await data.countTotal();

  return { meta, result };
};

const driverRequestAction = async (
  user: TAuthUser,
  payload: { userId: string; action: 'accept' | 'cancel' },
) => {
  let result;
  const { userId, action } = payload;

  const mySubscriptions = await MySubscription.findOne({ userId: user.userId });
  if (user.role === USER_ROLE.company) {
    if (!mySubscriptions) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Please subscribe first to use this feature',
      );
    }

    if (new Date(mySubscriptions.expiryIn).getTime() < Date.now()) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Your subscription has expired',
      );
    }

    if (mySubscriptions.remainingDrivers === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You have reached your driver limit',
      );
    }
  }

  const notificationData = {
    type: NOTIFICATION_TYPE.driverRequest as any,
    senderId: user.userId as any,
    receiverId: userId as any,
    linkId: userId as any,
    role: user.role,
    message: '',
  };

  switch (action) {
    case 'accept':
      result = await User.findOneAndUpdate(
        { _id: userId },
        { isApproved: true },
        { new: true },
      );

      if (user.role === USER_ROLE.company) {
        mySubscriptions!.remainingDrivers -= 1;
        await mySubscriptions?.save();
      }

      notificationData.message = `${user.name} has accepted your driver  request`;

      await sendNotification(
        { userId: user.userId, role: user.role } as TAuthUser,
        notificationData,
      );
      break;
    case 'cancel':
      result = await User.findOneAndUpdate(
        { _id: userId },
        { isApproved: false },
        { new: true },
      );

      await Company.findOneAndUpdate(
        { _id: user.myCompany },
        { $pull: { drivers: { driver: userId } } },
        { new: true },
      );

      notificationData.message = `${user.name} has cancelled your driver request`;

      await sendNotification(
        { userId: user.userId, role: user.role } as TAuthUser,
        notificationData,
      );

      break;
    default:
      break;
  }

  return result;
};

const customerOverview = async (query: Record<string, unknown>) => {
  const { year } = query;
  const { startDate, endDate } = StatisticHelper.statisticHelper(
    year as string,
  );

  const result = await User.aggregate([
    {
      $match: {
        $and: [
          {
            role: USER_ROLE.customer,
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
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
      $sort: { month: 1 },
    },
  ]);

  const statuses = ['customer'];

  const formattedResult = StatisticHelper.formattedResult(
    result,
    'roles',
    'role',
    statuses,
  );

  return formattedResult;
};

export const UserService = {
  updateUserActions,
  driverPerformance,
  createAdmin,
  getAllCustomers,
  getAllCompany,
  companyDetails,
  companyDispatchedHistory,
  getAllCompanyRequest,
  approveRequest,
  getAllAdmin,
  getAllDriverRequest,
  driverRequestAction,
  customerOverview,
};
