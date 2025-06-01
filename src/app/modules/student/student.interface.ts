import { ObjectId } from 'mongoose';

export type TStudent = {
  userId: ObjectId;
  schoolId: ObjectId;
  classId: ObjectId;
  sectionId: ObjectId;
  section: string;
  schoolName: string;
  className: string;
  fatherPhoneNumber: string;
  motherPhoneNumber: string;
};
