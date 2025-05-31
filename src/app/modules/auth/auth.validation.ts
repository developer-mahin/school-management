import { z } from 'zod';

const otpValidation = z.object({
  body: z.object({
    otp: z.number({ required_error: 'OTP is required' }),
  }),
});

const loginValidation = z.object({
  body: z.object({
    phoneNumber: z.string({ required_error: 'Phone  Number is required' }),
  }),
});

export const AuthValidation = {
  loginValidation,
  otpValidation,
};
