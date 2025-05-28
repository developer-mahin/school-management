import { model, Schema } from 'mongoose';
import { TSubject } from './subject.interface';

const subjectSchema = new Schema<TSubject>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'School',
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Subject = model<TSubject>('Subject', subjectSchema);
export default Subject;
