import { ObjectId } from 'mongoose';

export type TAnnouncement = {
  date: string;
  title: string;
  description: string;
  announcementTo: 'student' | 'teacher' | 'parents';
  schoolId: ObjectId;
  receiverId?: ObjectId;
};
