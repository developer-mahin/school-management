import { model, Schema } from 'mongoose';
import { TSchool } from './school.interface';

const schoolSchema = new Schema<TSchool>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    schoolName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    schoolAddress: {
      type: String,
      required: true,
      trim: true,
    },
    adminName: {
      type: String,
    },
    adminPhone: {
      type: String,
    },
    schoolImage: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const School = model<TSchool>('School', schoolSchema);
export default School;
