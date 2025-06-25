/* eslint-disable @typescript-eslint/no-explicit-any */
// export default sendSms;
import axios from 'axios';
import https from 'https';
import AppError from './AppError';
import httpStatus from 'http-status';
import config from '../../config';


const agent = new https.Agent({ rejectUnauthorized: false });

const sendSMS = async (payload: { phoneNumber: string; message: string }) => {

  const data = {
    username: config.kwt_sms.username,
    password: config.kwt_sms.password,
    sender: config.kwt_sms.sender,
    mobile: payload.phoneNumber,
    lang: 1,
    message: payload.message,
  };

  try {
    const response = await axios.post(`${config.kwt_sms.kwt_sms_url}`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      httpsAgent: agent,
    });

    console.log('SMS sent successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('SMS sending failed:', error.response?.data || error.message);
    throw new AppError(httpStatus.BAD_REQUEST, error);
  }
};

export default sendSMS;
