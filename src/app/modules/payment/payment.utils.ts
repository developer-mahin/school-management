import axios from 'axios';
import { TAuthUser } from '../../interface/authUser';
import { TSubscription } from '../subscription/subscription.interface';
import { TPayment } from './payment.interface';
import config from '../../../config';
import Parents from '../parents/parents.model';
import mongoose from 'mongoose';

export const createCheckoutSession = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentData: Partial<TPayment | TSubscription | any>,
  user: TAuthUser,
) => {
  const { subscriptionId, amount, timeline } = paymentData;

  const executePaymentOptions = {
    method: 'POST',
    url: `${config.payment_gateway.my_fatorah_base_url}/v2/ExecutePayment`,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${config.payment_gateway.my_fatorah_api_key}`,
      'Content-Type': 'application/json',
    },
    data: {
      PaymentMethodId: '2',
      CustomerName: 'Ahmed',
      DisplayCurrencyIso: 'KWD',
      MobileCountryCode: '+965',
      CustomerMobile: '12345678',
      CustomerEmail: 'xx@yy.com',
      InvoiceValue: Number(amount),
      CallBackUrl: `${config.base_api_url}/payment/confirm-payment?subscriptionId=${subscriptionId}&userId=${user.userId}&amount=${amount}&timeline=${timeline}`,
      ErrorUrl: `${config.base_api_url}/payment/failed-payment?subscriptionId=${subscriptionId}&userId=${user.userId}&amount=${amount}&timeline=${timeline}`,
      Language: 'en',
      CustomerReference: 'ref 1',
      CustomerCivilId: 12345678,
      UserDefinedField: 'Custom field',
      ExpiryDate: '',
      CustomerAddress: {
        Block: '',
        Street: '',
        HouseBuildingNo: '',
        Address: '',
        AddressInstructions: '',
      },
      InvoiceItems: [
        {
          ItemName: 'Product 01',
          Quantity: 1,
          UnitPrice: Number(amount),
        },
      ],
    },
  };

  const res = await axios.request(executePaymentOptions);

  return res.data;
};

export const findPartners = async (userId: string) => {
  const result = await Parents.findOne({ userId });

  const findParents = await Parents.aggregate([
    {
      $match: {
        childId: new mongoose.Types.ObjectId(String(result?.childId)),
      },
    },
  ]);

  return findParents;
};
