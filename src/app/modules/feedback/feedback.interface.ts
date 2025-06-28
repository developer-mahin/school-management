import { ObjectId } from 'mongoose';

export type TFeedback = {
  userId: ObjectId;
  ratings: number;
  review: string;
};
