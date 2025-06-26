import { z } from 'zod';

const paymentValidation = z.object({
  body: z.object({
    amount: z.number({ required_error: 'Amount is required' }),
    subscriptionId: z.string({ required_error: 'Subscription id is required' }),
  }),
});

export const PaymentValidation = {
  paymentValidation,
};
