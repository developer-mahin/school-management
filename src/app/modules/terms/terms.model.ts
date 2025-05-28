import { model, Schema } from 'mongoose';
import { TTerms } from './terms.interface';

const termsSchema = new Schema<TTerms>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'School',
    },
    termsName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Terms = model<TTerms>('Terms', termsSchema);
export default Terms;
