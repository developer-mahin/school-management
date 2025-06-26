import { ObjectId } from 'mongoose';

export type TParents = {
  userId: ObjectId;
  childId: ObjectId;
  schoolId: ObjectId;
};
