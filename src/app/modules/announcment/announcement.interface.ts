import { ObjectId } from 'mongoose';

export type TAnnouncement = {
  date: string;
  title: string;
  description: string;
  announcementTo: string;
  schoolId: ObjectId;
  receiverId: ObjectId;
};
