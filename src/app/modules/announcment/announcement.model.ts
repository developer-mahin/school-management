import { model, Schema } from 'mongoose';
import { TAnnouncement } from './announcement.interface';

const announcementSchema = new Schema<TAnnouncement>(
  {
    date: { type: String, required: [true, 'Date is required'] },
    title: { type: String, required: [true, 'Title is required'] },
    description: { type: String, required: [true, 'Description is required'] },
    announcementTo: {
      type: String,
      required: [true, 'Announcement to is required'],
      enum: ['student', 'teacher', 'parents'],
    },
    schoolId: { type: Schema.Types.ObjectId, required: true, ref: 'School' },
    receiverId: { type: Schema.Types.ObjectId, required: false, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

const Announcement = model<TAnnouncement>('Announcement', announcementSchema);

export default Announcement;
