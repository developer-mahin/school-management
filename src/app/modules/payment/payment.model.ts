import { model, Schema } from 'mongoose';
import { TPayment } from './payment.interface';

const paymentSchema = new Schema<TPayment>(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    paymentType: {
      type: String,
      required: [true, 'Payment type is required'],
      enum: ['card', 'cash', 'bank', 'paypal'],
      default: 'card',
      trim: true,
    },

    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
    },
    paymentId: {
      type: String,
      required: [true, 'Payment id is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Payment = model<TPayment>('Payment', paymentSchema);

export default Payment;
