import { ObjectId } from 'mongoose';

export type TPayment = {
  subscriptionId?: ObjectId;
  userId?: ObjectId;
  paymentType: 'card' | 'cash' | 'bank' | 'paypal';
  amount: number;
  paymentDate: Date;
  paymentId: string;
};
