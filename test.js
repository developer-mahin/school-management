import axios from 'axios';

// console.log('#################### InitiatePayment ########################');

const token =
  'UI-qJFcMpxOCKfsPCyRttURWxradR-OXOBllWFwMDu1DOFkP3CwMz_N097oxvrZJIo6iUnFCbILKnv9v8taNAKKfT8QYcXmKWxNUAP1gxA3qXaB0t5bu5ibt2eIdWcnqfTNWGoF_5kjdQYXQ_WG36dC94427HtejFAhy5hVOfigTwBkeQw9aeJmoyksN9uje_pUV8VQ2IHTU8o9yuGG2YBhvd-tUnOYX-AkII3uJNiHx8OlIwV7xkGT_zO1rgk2-2waJTkujIVYZ_ydIRyUXVvbG3Bhg_HTylIhxnvcFzfimd4styzKvfzNv-lJkFtOKQLeV0Lo1bZwIhvZ-szyzsveyun2EDHN4yVRvQC44TgTv2dsg-7kxiKfbjFzYwMujk4Up2J8-28qJJvz4ICpFX0qz9bl5g_zNa_oinYors0JwN-ZK8oufSNO2ijepJWYgTb68cj2IPXtKWWltey-lPY2CUk2WdKVrX_9ZpNSKGKpn-O-cICszVgO-YXAAzMjWnk5Cq9VSFQNn9Ul4t1IR-jgx9FMNz45QA9jc128qf-MYeemJVUcnh7sufICA7D6cFQdkgJ-YrqRkPowWhTH-BQnOouzsVMU_MSBadVWCTrbrdscMJTtdTMoSEBqSr25DNaazSfXvoiWdEvdWfw0zPSM2dhAVXFKVF1O_T4TQmDiiNVhdPj-1Mr0xHlhw572OY2aMZQ'; //token value to be placed here
const baseURL = 'https://api.myfatoorah.com';

console.log('#################### ExecutePayment ########################');

const executePaymentOptions = {
  method: 'POST',
  url: `${baseURL}/v2/ExecutePayment`,
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  data: {
    PaymentMethodId: '2',
    CustomerName: 'Ahmed',
    DisplayCurrencyIso: 'KWD',
    MobileCountryCode: '+965',
    CustomerMobile: '12345678',
    CustomerEmail: 'xx@yy.com',
    InvoiceValue: 100,
    CallBackUrl: `${baseURL}/v2/ExecutePayment`,
    ErrorUrl: 'https://google.com',
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
        UnitPrice: 100,
      },
    ],
  },
};

axios(executePaymentOptions)
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });
