/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AppError from '../../utils/AppError';
import OTP from './otp.model';
import sendSMS from '../../utils/sendSMS';

const sendOTP = async (
  phoneNumber: string,
  otpExpiryTime?: number,
  receiverType?: string,
  purpose?: string,
  otp?: number,
) => {
  const expiredAt = new Date();
  expiredAt.setMinutes(expiredAt.getMinutes() + otpExpiryTime!);

  const message = `Your OTP code is ${otp}. 
  It will expire in ${otpExpiryTime} minute${otpExpiryTime! > 1 ? 's' : ''}. 
Please do not share this code with anyone.`;

  if (receiverType === 'phone') {
    const emailBody = {
      phoneNumber,
      message
    };

    await sendSMS(emailBody);
  }

  const findExistingOtp = await OTP.findOne({
    sendTo: phoneNumber,
    receiverType,
    purpose,
  });

  if (findExistingOtp) {
    await OTP.findByIdAndDelete(findExistingOtp._id);
  }

  const newOtp = await OTP.create({
    sendTo: phoneNumber,
    receiverType,
    purpose,
    otp,
    expiredAt: expiredAt,
  });

  setTimeout(async () => {
    try {
      await OTP.findByIdAndDelete(newOtp._id);
      console.log('Otp deleted ');
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'something went wrong',
      );
    }
  }, 180000);

  return true;
};

const checkOtpByPhoneNumber = async (phoneNumber: string) => {
  const data = await OTP.findOne({
    sendTo: phoneNumber,
    status: 'pending',
    expiredAt: { $gt: new Date() },
  });

  return data;
};

const verifyOTP = async (otp: number, id: string) => {
  const data = await OTP.findOne({
    _id: new mongoose.Types.ObjectId(String(id)),
  });

  if (!data) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Otp not found');
  }

  if (Number(data.otp) !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Otp not matched');
  }

  data.status = 'verified';
  data.verifiedAt = new Date();
  await data.save();
  return true;
};

const deleteOtpById = async (id: string) => {
  return await OTP.findByIdAndDelete(id);
};

const deletedExpiredOtp = async () => {
  const currentTime = new Date();
  await OTP.deleteMany({ expiredAt: { $lt: currentTime } });
};

setTimeout(async () => {
  try {
    await deletedExpiredOtp();
    console.log('expired otp deleted');
  } catch (error) {
    console.error(error);
  }
}, 60000);

export const OtpService = {
  sendOTP,
  checkOtpByPhoneNumber,
  verifyOTP,
  deleteOtpById,
};
