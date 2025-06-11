import { ObjectId } from 'mongoose';
import { TDays } from '../classSchedule/classSchedule.interface';

export type TAttendanceStudent = {
  studentId: ObjectId;
};

export type TAttendance = {
  classId: ObjectId;
  schoolId: ObjectId;
  className: string;
  days: TDays;
  section: string;
  totalStudents: number;
  presentStudents: TAttendanceStudent[];
  absentStudents: TAttendanceStudent[];
  date: Date;
};
