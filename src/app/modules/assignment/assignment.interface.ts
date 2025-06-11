import { ObjectId } from 'mongoose';

export type TAssignment = {
  schoolId: ObjectId;
  classId: ObjectId;
  subjectId: ObjectId;
  section: string;
  title: string;
  dueDate: Date;
  marks: number;
  fileUrl?: string;
  status: 'on-going' | 'completed' | 'not-started';
};
