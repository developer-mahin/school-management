/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import { months, StatisticHelper } from '../../helper/staticsHelper';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import { TSubscription } from '../subscription/subscription.interface';
import { SubscriptionService } from '../subscription/subscription.service';
import { PaymentHelper } from './payment.helper';
import { TPayment } from './payment.interface';
import Payment from './payment.model';
import { createCheckoutSession } from './payment.utils';

const makePayment = async (
  payload: Partial<TPayment | TSubscription | any>,
  user: TAuthUser,
) => {
  let paymentData = {} as any;

  paymentData = {
    ...payload,
    paymentDate: new Date(),
  };

  const result = await createCheckoutSession(paymentData as any, user);

  return result;
};

const confirmPayment = async (query: Record<string, unknown>) => {
  const {
    companyId,
    driverId,
    jobRequestId,
    paymentType,
    subscriptionId,
    userId,
    amount,
    price,
    earnFrom,
    paymentIntentId,
  } = query;

  const paymentId = `pi_${crypto.randomBytes(16).toString('hex')}`;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const paymentBody = PaymentHelper.createPaymentBody({
      companyId,
      driverId,
      jobRequestId,
      paymentType,
      userId,
      amount,
      price,
      earnFrom,
      paymentIntentId,
      subscriptionId,
    });

    const subscriptionPaymentBody = {
      paymentType,
      userId: companyId,
      paymentId,
      amount: price,
      earnFrom,
      subscriptionId,
      paymentStatus: 'completed',
      paymentDate: new Date(),
    };

    if (earnFrom === 'subscription' && subscriptionId) {
      const subscription = await SubscriptionService.getSubscription(
        subscriptionId as string,
      );
      const mySubscriptionBody = PaymentHelper.createMySubscriptionBody({
        companyId,
        subscription,
        subscriptionId,
      });

      await PaymentHelper.handleMySubscriptionAndPayment({
        session,
        mySubscriptionBody,
        subscriptionPaymentBody,
        companyId,
        subscription,
      });
    } else {
      await PaymentHelper.handleNonSubscriptionPayment({
        session,
        paymentBody,
        driverId,
        userId,
        amount,
      });
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error);
  }
};

const earningStatistic = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { startDate, endDate } = StatisticHelper.statisticHelper(
    query.year as string,
  );

  // Aggregation pipeline
  const monthlyCounts = await Payment.aggregate([
    {
      $match: {
        $and: [
          {
            $and: [
              {
                createdAt: { $gte: startDate, $lt: endDate },
              },
              {
                companyId: new mongoose.Types.ObjectId(String(user.userId)),
              },
            ],
          },
          { paymentStatus: 'completed' },
        ],
      },
    },
    {
      $project: {
        month: { $month: '$createdAt' },
        amount: 1,
      },
    },
    {
      $group: {
        _id: '$month',
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // eslint-disable-next-line no-unused-vars
  const monthlyData = months.map((month) => ({
    name: month,
    amount: 0,
  }));

  // Assign the aggregated values to the appropriate month
  monthlyCounts.forEach((item: any) => {
    const monthIndex = item._id - 1; // Months are 1-indexed (1 = Jan, 2 = Feb, etc.)
    if (monthIndex >= 0 && monthIndex < 12) {
      monthlyData[monthIndex].amount = item.totalAmount;
    }
  });

  return monthlyData;
};

const paymentList = async (user: TAuthUser, query: Record<string, unknown>) => {
  const paymentAggregation = new AggregationQueryBuilder(query);

  const result = await paymentAggregation
    .customPipeline([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(String(user.userId)),
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
        $lookup: {
          from: 'profiles',
          localField: 'user.profile',
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
        $lookup: {
          from: 'jobrequests',
          localField: 'jobRequestId',
          foreignField: '_id',
          as: 'jobRequest',
        },
      },
      {
        $unwind: {
          path: '$jobRequest',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobRequest.jobId',
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
          name: '$user.name',
          email: '$user.email',
          userId: '$user._id',
          image: '$profile.image',
          data: '$createdAt',
          category: '$job.categoryName',
          serviceName: '$job.serviceName',
          amount: 1,
          transactionId: '$paymentId',
          paymentType: 1,
          paymentStatus: 1,
        },
      },
    ])
    .paginate()
    .search(['name'])
    .filter(['paymentStatus'])
    .sort()
    .execute(Payment);

  const meta = await paymentAggregation.countTotal(Payment);

  return { meta, result };
};

const paymentAction = async (
  user: TAuthUser,
  payload: {
    paymentId: string;
    action: 'completed' | 'failed';
  },
) => {
  const result = await Payment.updateOne(
    { _id: payload.paymentId },
    {
      $set: {
        paymentStatus: payload.action,
      },
    },
    {
      new: true,
    },
  );
  return result;
};

export const PaymentService = {
  paymentList,
  makePayment,
  confirmPayment,
  earningStatistic,
  paymentAction,
};
