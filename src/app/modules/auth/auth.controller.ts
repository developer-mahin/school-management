import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';

const loginUser = catchAsync(async (req, res) => {
  const result = await AuthService.loginUser(req.body);

  // res.cookie('refreshToken', refreshToken, {
  //   secure: config.NODE_ENV === 'production',
  //   httpOnly: true,
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User logged in successfully',
    data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const otp = req.body;
  const result = await AuthService.verifyOtp(token as string, otp);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Otp verified successfully',
    data: result,
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const result = await AuthService.resendOtp(token as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Otp sent successfully',
    data: result,
  });
});

export const AuthController = {
  resendOtp,
  verifyOtp,
  loginUser,
};
