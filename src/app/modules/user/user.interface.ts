/* eslint-disable no-unused-vars */
import { Model, ObjectId } from 'mongoose';

export type TRole =
  | 'admin'
  | 'supperAdmin'
  | 'school'
  | 'teacher'
  | 'parents'
  | 'student';

export type TStatus = 'active' | 'blocked';

export type TUser = {
  uid: string;
  studentId?: ObjectId;
  parentsId?: ObjectId;
  schoolId: ObjectId;
  teacherId: ObjectId;
  phoneNumber: string;
  name: string;
  image: string;
  role: TRole;
  status: TStatus;
  isDeleted: boolean;
  relation: 'father' | 'mother';
};

export interface UserModel extends Model<TUser> {
  isUserExist(id: string): Promise<TUser>;
  isMatchedPassword(password: string, hashPassword: string): Promise<boolean>;
  findLastUser(className: string, section: string): Promise<TUser>;
}
