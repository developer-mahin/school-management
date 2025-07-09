import { model, Schema } from 'mongoose';
import { TManager } from './manager.interface';

const managerSchema = new Schema<TManager>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'School',
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    managerRole: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Manager = model<TManager>('Manager', managerSchema);

export default Manager;
