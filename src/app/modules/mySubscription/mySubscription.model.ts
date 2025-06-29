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
  },
  { timestamps: true },
);

const MySubscription = model<TMySubscription>(
  'MySubscription',
  mySubscriptionModel,
);
export default MySubscription;
