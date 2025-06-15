import { model, Schema } from 'mongoose';
import { TGraderSystem } from './gradeSystem.interface';

const gradeSystemSchema = new Schema<TGraderSystem>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'School',
    },
    mark: {
      type: String,
      required: true,
      trim: true,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
    },
    gpa: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const GradeSystem = model<TGraderSystem>('GradeSystem', gradeSystemSchema);
export default GradeSystem;
