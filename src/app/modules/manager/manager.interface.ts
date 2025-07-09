import { ObjectId } from 'mongoose';

export type TManager = {
  userId: ObjectId;
  schoolId: ObjectId;
  managerRole: string;
};
