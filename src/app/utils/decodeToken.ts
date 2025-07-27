/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { Secret } from 'jsonwebtoken';
import AppError from './AppError';

export const decodeToken = (token: string, secret: Secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError(401, 'Access token expired, please login again');
    }
    throw new AppError(401, 'Invalid token');
  }
};
