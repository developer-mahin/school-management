import { model, Schema } from 'mongoose';
import { TFeedback } from './feedback.interface';

const feedbackSchema = new Schema<TFeedback>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    ratings: {
      type: Number,
      required: [true, 'Rating is required'],
    },
    review: {
      type: String,
      required: [true, 'Review is required'],
    },
  },
  {
    timestamps: true,
  },
);

const Feedback = model<TFeedback>('Feedback', feedbackSchema);
export default Feedback;
