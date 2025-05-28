import { model, Schema } from 'mongoose';
import { TLevel } from './level.interface';

const levelSchema = new Schema<TLevel>(
  {
    levelName: {
      type: String,
      required: true,
      trim: true,
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

const Level = model<TLevel>('Level', levelSchema);
export default Level;
