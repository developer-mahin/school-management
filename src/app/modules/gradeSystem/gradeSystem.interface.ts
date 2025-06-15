import { ObjectId } from 'mongoose';

export type TGraderSystem = {
  schoolId: ObjectId;
  mark: string;
  grade: string;
  gpa: number;
};
