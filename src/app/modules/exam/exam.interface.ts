import { ObjectId } from 'mongoose';

export type TExam = {
  termsId: ObjectId;
  subjectName: string;
  details: string;
  passGrade: number;
  className: string;
  date: Date;
  startTime: string;
  classRoom: string;
  duration: number;
  assignedTeacher: string;
  teacherId: ObjectId;
  schoolId: ObjectId;
};
