import { ObjectId } from 'mongoose';

export type TLevel = {
  levelName: string;
  schoolId: ObjectId;
};
