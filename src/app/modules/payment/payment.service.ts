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
import { getSubscriptionData, PaymentHelper } from './payment.helper';
import { TPayment } from './payment.interface';
import Payment from './payment.model';
import { createCheckoutSession, findPartners } from './payment.utils';
import MySubscription from '../mySubscription/mySubscription.model';
import Parents from '../parents/parents.model';
import School from '../school/school.model';
import User from '../user/user.model';
import sendNotification from '../../../socket/sendNotification';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';

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
  const { userId, subscriptionId, amount, timeline } = query;

  const paymentId = `pi_${crypto.randomBytes(16).toString('hex')}`;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const subscriptionPaymentBody = {
      userId,
      paymentId,
      amount,
      subscriptionId,
      timeline,
      paymentDate: new Date(),
    };

    console.log(amount, 'amount ===========>');
    const subscription = await SubscriptionService.getSubscription(
      subscriptionId as string,
    );

    const mySubscriptionBody = PaymentHelper.createMySubscriptionBody({
      amount: Number(amount),
      userId,
      timeline: Number(timeline) === 30 ? 'monthly' : 'yearly',
      subscription,
      subscriptionId,
    });

    // Combined logic from handleMySubscriptionAndPayment
    const findMySubscription = await MySubscription.findOne({
      userId,
    }).session(session);

    const mySubscriptionData = getSubscriptionData(subscription?.planName);

    let findOtherPartners = null;
    if (subscription?.planName.toLowerCase() === 'gold') {
      findOtherPartners = await findPartners(userId as string);
    }

    if (findMySubscription) {
      const updateData = {
        $set: {
          expiryIn: new Date(
            findMySubscription.expiryIn.getTime() +
              Number(timeline) * 24 * 60 * 60 * 1000,
          ),
          amount: Number(amount),
          timeline: Number(timeline) === 30 ? 'monthly' : 'yearly',
          subscriptionId: subscriptionId,
          remainingChildren:
            findMySubscription.remainingChildren +
            subscription.numberOfChildren,
          ...mySubscriptionData,
        },
      };

      if (subscription?.planName.toLowerCase() === 'gold') {
        // Update all partner users
        const partnerIds =
          findOtherPartners?.map((partner: any) => partner.userId) || [];

        // Use Promise.all instead of map for proper async handling
        await Promise.all(
          partnerIds.map(async (id) => {
            await MySubscription.findOneAndUpdate({ userId: id }, updateData, {
              new: true,
              upsert: true,
              session,
            });
          }),
        );
      } else {
        // Update only the current user
        await MySubscription.findOneAndUpdate({ userId }, updateData, {
          new: true,
          session,
        });
      }
    } else {
      if (subscription?.planName.toLowerCase() === 'gold') {
        // Create subscriptions for all partner users
        const partnerIds =
          findOtherPartners?.map((partner: any) => partner.userId) || [];

        // Use Promise.all instead of map for proper async handling
        await Promise.all(
          partnerIds.map(
            async (id) =>
              await MySubscription.create(
                [
                  {
                    userId: id,
                    subscriptionId: mySubscriptionBody.subscriptionId,
                    expiryIn: new Date(
                      Date.now() + Number(timeline) * 24 * 60 * 60 * 1000,
                    ),
                    amount: Number(amount),
                    timeline: Number(timeline) === 30 ? 'monthly' : 'yearly',
                    remainingChildren: subscription.numberOfChildren,
                    ...mySubscriptionData,
                  },
                ],
                { session },
              ),
          ),
        );
      } else {
        const mySubscription = await MySubscription.create(
          [mySubscriptionBody],
          {
            session,
          },
        );

        if (!mySubscription)
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'My Subscription not created',
          );
      }
    }

    // Create payment record
    const data = await Payment.create([subscriptionPaymentBody], { session });

    if (!data)
      throw new AppError(httpStatus.BAD_REQUEST, 'Payment not created');

    // Get user and school information for notification
    const parents = await Parents.findOne({
      userId: userId,
    }).session(session);

    const school = await School.findById(parents?.schoolId).session(session);

    const findUser = await User.findOne({
      _id: userId,
    }).session(session);

    const user = {
      userId: findUser?._id,
    };

    // Send notification (this might need to be outside transaction if it's external)
    await sendNotification(user as any, {
      senderId: findUser?._id,
      role: findUser?.role,
      receiverId: school?._id,
      message: `New Payment ${subscriptionPaymentBody.amount} USD from ${findUser?.name}`,
      type: NOTIFICATION_TYPE.PAYMENT,
      linkId: data[0]?._id,
    });

    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(httpStatus.BAD_REQUEST, error.message || error);
  } finally {
    await session.endSession();
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
