import { ObjectId } from 'mongoose';

export type TExam = {
  subjectName: string;
  details: string;
  passGrade: number;
  class: string;
  date: Date;
  startTime: string;
  classRoom: string;
  duration: number;
  assignedTeacher: string;
  teacherId: ObjectId;
  schoolId: ObjectId;
};
