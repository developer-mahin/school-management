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

  console.log("#################### confirmPayment ########################");

  const { userId, subscriptionId, amount } = query;

  const paymentId = `pi_${crypto.randomBytes(16).toString('hex')}`;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const subscriptionPaymentBody = {
      userId,
      paymentId,
      amount,
      subscriptionId,
      paymentDate: new Date(),
    };

    const subscription = await SubscriptionService.getSubscription(
      subscriptionId as string,
    );

    const mySubscriptionBody = PaymentHelper.createMySubscriptionBody({
      userId,
      subscription,
      subscriptionId,
    });

    await PaymentHelper.handleMySubscriptionAndPayment({
      session,
      mySubscriptionBody,
      subscriptionPaymentBody,
      userId,
      subscription,
    });

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
        createdAt: { $gte: startDate, $lt: endDate },
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
        $match: {},
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
          from: 'subscriptions',
          localField: 'subscriptionId',
          foreignField: '_id',
          as: 'subscription',
        },
      },
      {
        $unwind: {
          path: '$subscription',
          preserveNullAndEmptyArrays: true,
        },
      },
    ])
    .sort()
    .paginate()
    .search(['name'])
    .filter(['paymentStatus'])
    .execute(Payment);

  const meta = await paymentAggregation.countTotal(Payment);

  return { meta, result };
};

export const PaymentService = {
  paymentList,
  makePayment,
  confirmPayment,
  earningStatistic,
};
