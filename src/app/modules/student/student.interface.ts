import { ObjectId } from 'mongoose';

export type TStudent = {
  userId: ObjectId;
  schoolId: ObjectId;
  classId: ObjectId;
  section: string;
  schoolName: string;
  className: string;
  fatherPhoneNumber: string;
  motherPhoneNumber: string;
  parentsMessage: string;
};

export type StudentRow = {
  name: string;
  phoneNumber: string;
  fatherPhoneNumber: string;
  motherPhoneNumber: string;
  className: string;
  schoolName: string;
  section: string;
  schoolId: string;
  classId: string;
};
