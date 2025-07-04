import { ObjectId } from 'mongoose';

export type TAssignment = {
  schoolId: ObjectId;
  classId: ObjectId;
  subjectId: ObjectId;
  teacherId: ObjectId;
  section: string;
  title: string;
  description: string;
  dueDate: Date;
  marks: number;
  fileUrl?: string;
  status: 'on-going' | 'completed' | 'expired';
};

export type TMarkComplete = {
  studentId: string;
  grade: number;
};
