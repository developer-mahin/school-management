/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import { emailVerifyHtml } from '../../../shared/html/emailVerifyHtml';
import { forgotPasswordHtml } from '../../../shared/html/forgotPasswordHtml';
import { USER_STATUS } from '../../constant';
import AppError from '../../utils/AppError';
import { decodeToken } from '../../utils/decodeToken';
import generateToken from '../../utils/generateToken';
import { OtpService } from '../otp/otp.service';
import { TUser } from '../user/user.interface';
import User from '../user/user.model';


const loginUser = async (payload: Pick<TUser, 'phoneNumber'>) => {
  const { phoneNumber } = payload;
  const user = await User.findOne({ phoneNumber }).select('+password');

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found!');
  }

  const isDeleted = user?.isDeleted;
  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
  }

  const checkUserStatus = user?.status;
  if (checkUserStatus === USER_STATUS.blocked) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked!');
  }


  const userData = {
    userId: user?._id,
    uid: user?.uid,
    studentId: user?.studentId,
    parentsId: user?.parentsId,
    schoolId: user?.schoolId,
    teacherId: user?.teacherId,
    phoneNumber: user?.phoneNumber,
    name: user?.name,
    role: user?.role,
  };

  const accessToken = generateToken(
    userData,
    config.jwt.access_token as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = generateToken(
    userData,
    config.jwt.refresh_token as Secret,
    config.jwt.refresh_expires_in as string,
  );

  const loginData = await User.findOne({
    phoneNumber,
  }).populate('profile');
  return {
    accessToken,
    user: loginData,
    refreshToken,
  };
};

const verifyOtp = async (token: string, otp: { otp: number }) => {
  const decodedUser = decodeToken(
    token,
    config.jwt.forgot_password_token as Secret,
  ) as JwtPayload;

  if (!decodedUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }

  const checkOtpExist = await OtpService.checkOtpByEmail(
    decodedUser.user.email,
  );

  if (!checkOtpExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Otp doesn't exist");
  }

  const otpVerify = await OtpService.verifyOTP(
    otp.otp,
    checkOtpExist?._id.toString(),
  );

  if (!otpVerify) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Otp not matched');
  }

  await OtpService.deleteOtpById(checkOtpExist?._id.toString());
  const tokenGenerate = generateToken(
    decodedUser.user,
    config.jwt.reset_password_token as Secret,
    config.jwt.reset_password_expires_in as string,
  );
  return { resetPasswordToken: tokenGenerate };
};

const resendOtp = async (
  token: string,
  payload: { email?: string; purpose: string },
) => {
  const decodedUser = decodeToken(
    token,
    payload.purpose === 'email-verification'
      ? (config.jwt.sing_up_token as Secret)
      : (config.jwt.forgot_password_token as Secret),
  ) as JwtPayload;

  const otp = Math.floor(100000 + Math.random() * 900000);

  const emailBody = {
    email:
      payload.purpose === 'email-verification'
        ? decodedUser.email
        : decodedUser.user.email,
    html:
      payload.purpose === 'email-verification'
        ? emailVerifyHtml('Email Verification', otp)
        : forgotPasswordHtml('Forget Password', otp),
  };

  const otpExpiryTime = parseInt(config.otp_expire_in as string) || 3;

  await OtpService.sendOTP(
    emailBody,
    otpExpiryTime,
    'email',
    payload.purpose,
    otp,
  );
};


export const AuthService = {
  resendOtp,
  loginUser,
  verifyOtp
};
