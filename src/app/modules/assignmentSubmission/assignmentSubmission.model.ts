import mongoose, { model, Schema } from 'mongoose';
import { TAssignmentSubmission } from './assignmentSubmission.interface';

const assignmentSubmissionSchema = new Schema<TAssignmentSubmission>(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    grade: {
      type: Number,
      required: true,
      default: 0,
    },
    submittedFile: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const AssignmentSubmission = model<TAssignmentSubmission>(
  'AssignmentSubmission',
  assignmentSubmissionSchema,
);
export default AssignmentSubmission;
