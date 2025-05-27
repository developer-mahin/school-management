import { ObjectId } from 'mongoose';

export type TReview = {
  userId: ObjectId;
  driverId: ObjectId;
  serviceId?: ObjectId;
  rating: number;
};
