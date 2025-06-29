/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import httpStatus from 'http-status';
import AppError from '../../utils/AppError';
import MySubscription from '../mySubscription/mySubscription.model';
import User from '../user/user.model';
import Payment from './payment.model';

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
  const findUser = await User.findOne({
    _id: userId,
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
            findMySubscription.remainingChildren + subscription.numberOfChildren,
        },
      },
      { new: true, session },
    );

    await findUser?.save({ session });
  } else {
    const mySubscription = await MySubscription.create([mySubscriptionBody], {
      session,
    });
    if (!mySubscription)
      throw new AppError(httpStatus.BAD_REQUEST, 'My Subscription not created');
  }

  await Payment.create([subscriptionPaymentBody], { session });
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
