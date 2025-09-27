import httpStatus from 'http-status';
import AppError from '../../utils/AppError';
import { TSubscription } from './subscription.interface';
import Subscription from './subscription.model';
import { TAuthUser } from '../../interface/authUser';
import MySubscription from '../mySubscription/mySubscription.model';
import mongoose from 'mongoose';

const createSubscription = async (payload: TSubscription) => {
  let numberOfChildren = 0;

  if (payload.planName.toLowerCase().includes('plus')) {
    numberOfChildren = 1;
  } else if (payload.planName.toLowerCase().includes('silver')) {
    numberOfChildren = 100;
  } else if (payload.planName.toLowerCase().includes('gold')) {
    numberOfChildren = 100;
  }

  const subscription = await Subscription.create({
    ...payload,
    numberOfChildren,
  });
  return subscription;
};

const getSubscriptions = async () => {
  const subscriptions = await Subscription.find();
  return subscriptions;
};

const getSubscription = async (subscriptionId: string) => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription)
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  return subscription;
};

const deleteSubscription = async (subscriptionId: string) => {
  const subscription = await Subscription.findByIdAndDelete(subscriptionId);
  if (!subscription)
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  return subscription;
};

const updateSubscription = async (
  subscriptionId: string,
  payload: TSubscription,
) => {
  const subscription = await Subscription.findByIdAndUpdate(
    subscriptionId,
    payload,
    { new: true },
  );
  if (!subscription)
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  return subscription;
};

const getMySubscription = async (user: TAuthUser) => {
  const subscription = await MySubscription.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(String(user.userId)) },
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
  ]);

  return subscription[0] || {};
};

export const SubscriptionService = {
  getSubscription,
  getSubscriptions,
  createSubscription,
  deleteSubscription,
  updateSubscription,
  getMySubscription,
};
