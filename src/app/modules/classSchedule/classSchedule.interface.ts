import { ObjectId } from 'mongoose';

export type TClassSchedule = {
  schoolId: ObjectId;
  classId: ObjectId;
  sectionId: ObjectId;
  subjectId: ObjectId;
  teacherId: ObjectId;

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
