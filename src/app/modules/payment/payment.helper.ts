/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import httpStatus from 'http-status';
import AppError from '../../utils/AppError';
import MySubscription from '../mySubscription/mySubscription.model';
import User from '../user/user.model';
import Payment from './payment.model';
import Parents from '../parents/parents.model';
import School from '../school/school.model';
import sendNotification from '../../../socket/sendNotification';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';

const handleMySubscriptionAndPayment = async ({
  session,
  mySubscriptionBody,
  subscriptionPaymentBody,
  userId,
  subscription,
}: any) => {
  const findMySubscription = await MySubscription.findOne({
    userId,
  });

  if (findMySubscription) {
    await MySubscription.findOneAndUpdate(
      { userId },
      {
        $set: {
          expiryIn: new Date(
            findMySubscription.expiryIn.getTime() +
            subscription.timeline * 24 * 60 * 60 * 1000,
          ),
          remainingChildren:
            findMySubscription.remainingChildren +
            subscription.numberOfChildren,
        },
      },
      { new: true, session },
    );
  } else {
    const mySubscription = await MySubscription.create([mySubscriptionBody], {
      session,
    });
    if (!mySubscription)
      throw new AppError(httpStatus.BAD_REQUEST, 'My Subscription not created');
  }

  const data = await Payment.create([subscriptionPaymentBody], { session });

  const parents = await Parents.findOne({
    userId: userId,
  });
  const school = await School.findById(parents?.schoolId);

  const findUser = await User.findOne({
    _id: userId,
  });
  
  const user = {
    userId: findUser?._id,
  };

  await sendNotification(user as any, {
    senderId: findUser?._id,
    role: findUser?.role,
    receiverId: school?._id,
    message: `New Payment ${subscriptionPaymentBody.amount} USD from ${findUser?.name}`,
    type: NOTIFICATION_TYPE.PAYMENT,
    linkId: data[0]?._id,
  });

  if (!data)
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment not created');
};

// Helper function to create payment body
const createPaymentBody = ({
  userId,
  amount,
  paymentIntentId,
  subscriptionId,
}: any) => {
  return {
    userId,
    subscriptionId,
    amount,
    paymentId:
      paymentIntentId || `pi_${crypto.randomBytes(16).toString('hex')}`,
    paymentDate: new Date(),
  };
};

// Helper function to create subscription body
const createMySubscriptionBody = ({
  userId,
  subscription,
  subscriptionId,
}: any) => {
  return {
    userId,
    subscriptionId,
    expiryIn: new Date(
      Date.now() + subscription.timeline * 24 * 60 * 60 * 1000,
    ),
    remainingChildren: subscription.numberOfChildren,
  };
};

export const PaymentHelper = {
  createPaymentBody,
  createMySubscriptionBody,
  handleMySubscriptionAndPayment,
};
