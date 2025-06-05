import { ObjectId } from 'mongoose';

type TDays =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type TClassSchedule = {
  schoolId: ObjectId;
  classId: ObjectId;
  subjectId: ObjectId;
  teacherId: ObjectId;

  days: TDays;
  period: string;
  description: string;
  selectTime: string;
  section: string;
  endTime: string;
  date: Date;
  roomNo: string;
};
