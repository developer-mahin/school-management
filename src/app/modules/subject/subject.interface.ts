import { ObjectId } from 'mongoose';

export type TSubject = {
  schoolId: ObjectId;
  subjectName: string;
};
