import { model, Schema } from 'mongoose';
import { TMySubscription } from './mySubscription.interface';

const mySubscriptionModel = new Schema<TMySubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User id is required'],
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Subscription id is required'],
    },
    expiryIn: { type: Date, required: [true, 'Expiry date is required'] },
    remainingChildren: {
      type: Number,
      default: 0,
    },
    amount: { type: Number, required: true },
    timeline: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
      default: 'monthly',
    },
    canChat: { type: Boolean, default: false },
    canSeeExam: { type: Boolean, default: false },
    canSeeAssignment: { type: Boolean, default: false },
    isAttendanceEnabled: { type: Boolean, default: false },
    isExamGradeEnabled: { type: Boolean, default: false },
    unlockedStudents: { type: Number, default: 0 },
    unlockedParents: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const MySubscription = model<TMySubscription>(
  'MySubscription',
  mySubscriptionModel,
);
export default MySubscription;
