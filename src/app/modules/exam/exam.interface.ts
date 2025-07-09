import { ObjectId } from 'mongoose';

export type TExam = {
  termsId: ObjectId;
  teacherId: ObjectId;
  schoolId: ObjectId;
  subjectId: ObjectId;
  classId: ObjectId;
  totalMarks: number;
  details: string;
  passGrade: number;
  date: Date;
  startTime: string;
  classRoom: string;
  duration: string;
  isSubmitted: boolean;
  instruction: string;
};
