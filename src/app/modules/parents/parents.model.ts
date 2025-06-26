import { model, Schema } from 'mongoose';
import { TParents } from './parents.interface';

const parentsSchema = new Schema<TParents>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Parents = model<TParents>('Parents', parentsSchema);
export default Parents;
