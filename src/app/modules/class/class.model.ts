import { model, Schema } from 'mongoose';
import { TClass } from './class.interface';

const classSchema = new Schema<TClass>(
  {
    levelId: {
      type: Schema.Types.ObjectId,
      ref: 'Level',
      required: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    levelName: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: [String],
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Class = model<TClass>('Class', classSchema);
export default Class;
