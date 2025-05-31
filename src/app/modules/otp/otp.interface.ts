export type TOTP = {
  sendTo: string;
  receiverType: string;
  purpose: 'email-verification' | 'forget-password' | 'login-verification';
  otp: string;
  expiredAt: Date;
  verifiedAt: Date;
  status: 'verified' | 'pending' | 'expired';
};
