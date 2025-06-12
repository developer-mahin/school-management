import { ObjectId } from 'mongoose';

export type TResult = {
  examId: ObjectId;
  schoolId: ObjectId;
  teacherId: ObjectId;
  students: {
    studentId: ObjectId;
    mark: number;
  };
};
