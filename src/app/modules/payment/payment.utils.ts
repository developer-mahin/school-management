// import config from '../../../config';
// import { TAuthUser } from '../../interface/authUser';
// import Stripe from 'stripe';
// import { TSubscription } from '../subscription/subscription.interface';
// import { TPayment } from './payment.interface';

import axios from 'axios';

// export const calculateAmount = (amount: number) => {
//   return Number(amount) * 100;
// };

// const stripe = new Stripe(config.stripe_secret_key as string, {
//   apiVersion: '2025-03-31.basil',
//   typescript: true,
// });

// export const createCheckoutSession = async (
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   paymentData: Partial<TPayment | TSubscription | any>,
//   user: TAuthUser,
// ) => {
//   const { subscriptionId, amount } = paymentData;

//   let paymentGatewayData;
//   if (subscriptionId && amount) {
//     paymentGatewayData = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             product_data: {
//               name: `Payment from  ${user.name}`,
//               description: `${user.name} purchased a subscription`,
//             },
//             unit_amount: calculateAmount(amount),
//           },
//           quantity: 1,
//         },
//       ],

//       success_url: `${config.base_url}/payment/confirm-payment?sessionId={CHECKOUT_SESSION_ID}&subscriptionId=${subscriptionId}&userId=${user.userId}&amount=${amount}`,

//       cancel_url: `${config.base_url}/payments/cancel?paymentId=${'paymentDummy'}`,
//       mode: 'payment',

//       client_reference_id: `${subscriptionId}`,
//       invoice_creation: {
//         enabled: true,
//       },
//     });
//   } else {
//     throw new Error('Payment data is not valid');
//   }

//   return paymentGatewayData.url;
// };

export const executePayment = async (
  paymentMethodId: number,
  invoiceAmount: number,
  customerInfo: {
    name: string;
    email: string;
    mobile: string;
    subscriptionId?: string;
    userId?: string;
  },
) => {
  const callbackParams = `subscriptionId=${customerInfo.subscriptionId}&userId=${customerInfo.userId}&amount=${invoiceAmount}`;

  const payload = {
    PaymentMethodId: paymentMethodId,
    InvoiceAmount: invoiceAmount,
    CustomerName: customerInfo.name,
    CustomerEmail: customerInfo.email,
    CustomerMobile: customerInfo.mobile,
    CallBackUrl: `https://yourdomain.com/payment/success?${callbackParams}`,
    ErrorUrl: `https://yourdomain.com/payment/fail?userId=${customerInfo.userId}`,
    DisplayCurrencyIso: 'KWD',
  };

  const res = await axios.post('/v2/ExecutePayment', payload);
  return res.data; // contains PaymentURL
};
