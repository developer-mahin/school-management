import { model, Schema } from 'mongoose';
import { TAssignment } from './assignment.interface';

const assignmentSchema = new Schema<TAssignment>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'School',
    },
    classId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Class',
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Subject',
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    marks: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['on-going', 'completed', 'not-started'],
      default: 'on-going',
    },
  },
  {
    timestamps: true,
  },
);

const Assignment = model<TAssignment>('Assignment', assignmentSchema);
export default Assignment;
