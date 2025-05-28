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
    subjectName: {
      type: String,
      required: true,
      trim: true,
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
    class: {
      type: String,
      required: true,
      trim: true,
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
      type: Number,
      required: true,
    },
    assignedTeacher: {
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
