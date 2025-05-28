import { Router } from 'express';
import validateRequest from '../../middleware/validation';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

router
  .post(
    '/login',
    validateRequest(AuthValidation.loginValidation),
    AuthController.loginUser,
  )
  .post(
    '/verify_otp',
    validateRequest(AuthValidation.otpValidation),
    AuthController.verifyOtp,
  )
  .post('/resend_otp', AuthController.resendOtp);

export const AuthRoutes = router;
