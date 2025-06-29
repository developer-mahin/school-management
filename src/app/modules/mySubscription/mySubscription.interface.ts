import { ObjectId } from 'mongoose';

export type TMySubscription = {
  userId: ObjectId;
  subscriptionId: ObjectId;
  expiryIn: Date;
  remainingChildren: number;
};
