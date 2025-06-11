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
