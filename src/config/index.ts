import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,

  salt_round: process.env.SALT_ROUND,
  socket_port: process.env.SOCKET_PORT,
  ip: process.env.IP,

  admin: {
    admin_email: process.env.ADMIN_EMAIL,
    admin_password: process.env.ADMIN_PASSWORD,
  },

  monitor_usernames: process.env.MONITOR_USERNAMES,
  monitor_passwords: process.env.MONITOR_PASSWORDS,
  project_name: process.env.PROJECT_NAME,

  jwt: {
    access_token: process.env.ACCESS_KEY,
    access_expires_in: process.env.ACCESS_EXPIRE_IN,
    sing_in_token: process.env.SIGNIN_KEY,
    sing_in_expires_in: process.env.SIGNIN_EXPIRE_IN,
    refresh_token: process.env.REFRESH_KEY,
    refresh_expires_in: process.env.REFRESH_EXPIRE_IN,
  },

  otp_expire_in: process.env.OTP_EXPIRE_IN,
  smtp_username: process.env.SMTP_USERNAME,
  smtp_password: process.env.SMTP_PASSWORD,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  base_url: process.env.BASE_URL,
  logger_username: process.env.LOGGER_USERNAME,
  logger_password: process.env.LOGGER_PASSWORD,
  admin_password: process.env.ADMIN_PASSWORD,

  twilio: {
    account_sid: process.env.TWILIO_ACCOUNT_SID,
    auth_token: process.env.TWILIO_AUTH_TOKEN,
    phone_number: process.env.TWILIO_PHONE_NUMBER,
  },
};
