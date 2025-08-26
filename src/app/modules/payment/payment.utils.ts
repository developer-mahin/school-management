import config from '../../../config';
import { TAuthUser } from '../../interface/authUser';
import Stripe from 'stripe';
import { TSubscription } from '../subscription/subscription.interface';
import { TPayment } from './payment.interface';

export const calculateAmount = (amount: number) => {
  return Number(amount) * 100;
};

const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: '2025-03-31.basil',
  typescript: true,
});

export const createCheckoutSession = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentData: Partial<TPayment | TSubscription | any>,
  user: TAuthUser,
) => {
  const { subscriptionId, amount } = paymentData;

  let paymentGatewayData;
  if (subscriptionId && amount) {
    paymentGatewayData = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Payment from  ${user.name}`,
              description: `${user.name} purchased a subscription`,
            },
            unit_amount: calculateAmount(amount),
          },
          quantity: 1,
        },
      ],

      success_url: `${config.base_url}/api/v1/payment/confirm-payment?sessionId={CHECKOUT_SESSION_ID}&subscriptionId=${subscriptionId}&userId=${user.userId}&amount=${amount}`,

      cancel_url: `${config.base_url}/api/v1/payments/cancel?paymentId=${'paymentDummy'}`,
      mode: 'payment',

      client_reference_id: `${subscriptionId}`,
      invoice_creation: {
        enabled: true,
      },
    });
  } else {
    throw new Error('Payment data is not valid');
  }

  return paymentGatewayData.url;
};


