/* eslint-disable @typescript-eslint/no-explicit-any */
// import twilio from 'twilio';
// import config from '../../config';
// import AppError from './AppError';
// import httpStatus from 'http-status';

// const accountSid = config.twilio.account_sid;
// const authToken = config.twilio.auth_token;
// const client = twilio(accountSid, authToken);

// const sendSms = async (payload: { phoneNumber?: string; message: string }) => {
//   try {
//     await client.messages.create({
//       from: config.twilio.phone_number,
//       to: payload.phoneNumber || '+96599551188',
//       body: payload.message,
//     });
//   } catch (error: any) {
//     throw new AppError(httpStatus.BAD_REQUEST, error);
//   }
// };

// export default sendSms;
import axios from 'axios';
import https from 'https';
import AppError from './AppError';
import httpStatus from 'http-status';
const agent = new https.Agent({ rejectUnauthorized: false });

const sendSMS = async (data: {
  phoneNumber: string;
  message: string;
}) => {
  const url = 'https://api.kwtsms.com/send/';
  const payload = new URLSearchParams({
    username: 'petroliapp',
    password: 'Kuwt@95189518',
    sender: 'Classaty',
    to: data.phoneNumber,
    message: data.message,
  });

  try {
    const response = await axios.post(url, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '*/*',
      },
      httpsAgent: agent,
    });

    console.log('Response:', response);
  } catch (error: any) {
    console.error('SMS sending failed:', error.response?.data || error.message);
    throw new AppError(httpStatus.BAD_REQUEST, error);
  }
};


export default sendSMS;