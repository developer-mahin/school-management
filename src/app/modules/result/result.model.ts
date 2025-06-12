import { model, Schema } from 'mongoose';
import { TResult } from './result.interface';

const studentsSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Student',
  },
  mark: {
    type: Number,
    required: true,
  },
});

const resultSchema = new Schema<TResult>(
  {
    examId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Exam',
    },
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
    students: [studentsSchema],
  },
  {
    timestamps: true,
  },
);

const Result = model<TResult>('Result', resultSchema);
export default Result;
