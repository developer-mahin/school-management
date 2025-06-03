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
  sectionId: ObjectId;
  subjectId: ObjectId;
  teacherId: ObjectId;
  days: TDays;
  className: string;
  subjectName: string;
  period: string;
  description: string;
  teacherName: string;
  selectTime: string;
  section: string;
  endTime: string;
  date: Date;
  roomNo: string;
};
