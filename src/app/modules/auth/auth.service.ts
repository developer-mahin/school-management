/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import { USER_STATUS } from '../../constant';
import AppError from '../../utils/AppError';
import { decodeToken } from '../../utils/decodeToken';
import generateToken from '../../utils/generateToken';
import { OtpService } from '../otp/otp.service';
import { TUser } from '../user/user.interface';
import User from '../user/user.model';

const loginUser = async (payload: Pick<TUser, 'phoneNumber'>) => {
  const { phoneNumber } = payload;

  const user = await User.findOne({ phoneNumber });

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

  const otp = Math.floor(100000 + Math.random() * 900000);

  const otpExpiryTime = parseInt(config.otp_expire_in as string) || 3;

  await OtpService.sendOTP(
    phoneNumber,
    otpExpiryTime,
    'phone',
    'login-verification',
    otp,
  );

  const userData = {
    userId: user?._id,
    phoneNumber: user?.phoneNumber,
    role: user?.role,
  };

  const accessToken = generateToken(
    userData,
    config.jwt.sing_in_token as Secret,
    config.jwt.sing_in_expires_in as string,
  );

  return {
    signInToken: accessToken,
  };
};

const verifyOtp = async (token: string, otp: { otp: number }) => {
  const decodedUser = decodeToken(
    token,
    config.jwt.sing_in_token as Secret,
  ) as JwtPayload;

  if (!decodedUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }

  const checkOtpExist = await OtpService.checkOtpByPhoneNumber(
    decodedUser.phoneNumber,
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

  const findUser = await User.findOne({
    phoneNumber: decodedUser.phoneNumber,
  });

  if (!findUser) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

  const userData = {
    userId: findUser._id,
    studentId: findUser.studentId,
    parentsId: findUser.parentsId,
    schoolId: findUser.schoolId,
    teacherId: findUser.teacherId,
    phoneNumber: findUser.phoneNumber,
    role: findUser.role,
  };

  const tokenGenerate = generateToken(
    userData,
    config.jwt.access_token as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = generateToken(
    userData,
    config.jwt.refresh_token as Secret,
    config.jwt.refresh_expires_in as string,
  );

  return { accessToken: tokenGenerate, refreshToken, user: findUser };
};

const resendOtp = async (token: string) => {
  const decodedUser = decodeToken(
    token,
    config.jwt.sing_in_token as Secret,
  ) as JwtPayload;

  const { phoneNumber } = decodedUser;

  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpiryTime = parseInt(config.otp_expire_in as string) || 3;

  await OtpService.sendOTP(
    phoneNumber,
    otpExpiryTime,
    'phone',
    'login-verification',
    otp,
  );
};

export const AuthService = {
  resendOtp,
  loginUser,
  verifyOtp,
};
