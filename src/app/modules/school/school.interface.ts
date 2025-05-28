import { ObjectId } from 'mongoose';

export type TSchool = {
  userId: ObjectId;
  schoolName: string;
  schoolAddress: string;
  adminName: string;
  schoolImage: string;
  coverImage: string;
};
