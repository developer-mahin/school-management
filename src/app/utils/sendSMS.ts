/* eslint-disable @typescript-eslint/no-explicit-any */
import twilio from 'twilio';
import config from '../../config';
import AppError from './AppError';
import httpStatus from 'http-status';

const accountSid = config.twilio.account_sid;
const authToken = config.twilio.auth_token;
const client = twilio(accountSid, authToken);

const sendSms = async (payload: { phoneNumber?: string; message: string }) => {
  try {
    await client.messages.create({
      from: config.twilio.phone_number,
      to: payload.phoneNumber || '+96599551188',
      body: payload.message,
    });
  } catch (error: any) {
    throw new AppError(httpStatus.BAD_REQUEST, error);
  }
};

export default sendSms;
