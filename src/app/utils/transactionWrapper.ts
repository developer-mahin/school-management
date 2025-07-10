/* eslint-disable no-unused-vars */
import mongoose from 'mongoose';
import AppError from './AppError';
import httpStatus from 'http-status';

export const transactionWrapper = async <T>(
  operation: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await operation(session); // 👈 session is passed here
    await session.commitTransaction();
    session.endSession();
    return result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};
