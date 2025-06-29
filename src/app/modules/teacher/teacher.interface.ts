import { ObjectId } from 'mongoose';

export type TTeacher = {
  userId: ObjectId;
  schoolId: ObjectId;
  schoolName: string;
  subjectId: ObjectId;
  subjectName: string;
};
