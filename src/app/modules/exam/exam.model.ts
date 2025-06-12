import { model, Schema } from 'mongoose';
import { TExam } from './exam.interface';

const examSchema = new Schema<TExam>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'School',
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Teacher',
    },
    termsId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Terms',
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Subject',
    },
    classId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Class',
    },

    details: {
      type: String,
      required: true,
      trim: true,
    },
    passGrade: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    classRoom: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
    },
    isSubmitted: {
      type: Boolean,
      required: true,
      default: false,
    },
    instruction: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Exam = model<TExam>('Exam', examSchema);
export default Exam;
