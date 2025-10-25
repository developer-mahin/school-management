import { ObjectId } from 'mongoose';

export type TStudentsGrader = {
  studentId: ObjectId;
  mark: number;
  grade: string;
  gpa: number;
};

export type TResult = {
  examId: ObjectId;
  schoolId: ObjectId;
  teacherId: ObjectId;
  students: TStudentsGrader[];
};

export type TResultUpdate = {
  termsId: string;
  resultId: string;
  subjectName: string;
  studentId: string;
  mark: number;
};
