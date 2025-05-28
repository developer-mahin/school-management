/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../../config';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { USER_ROLE } from '../../constant';
import AppError from '../../utils/AppError';
import generateUID from '../../utils/generateUID';
import User from './user.model';

const updateUserActions = async (id: string, action: string): Promise<any> => {
  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.status === action) {
    throw new AppError(httpStatus.BAD_REQUEST, `User already ${action}`);
  }

  switch (action) {
    case 'blocked':
      user.status = 'blocked';
      await user.save();
      break;
    case 'active':
      user.status = 'active';
      await user.save();
      break;
    default:
      break;
  }

  return user;
};

const getAllCustomers = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    User.find({ role: 'customer' }).populate('profile'),
    query,
  );

  const result = await queryBuilder
    .search(['name', 'email'])
    .filter(['role'])
    .paginate()
    .sort()
    .queryModel.sort();

  const meta = await queryBuilder.countTotal();

  return { meta, result };
};

const createAdmin = async (payload: { email: string; name: string }) => {
  const { name, email } = payload;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const createAdmin = await User.create(
      [
        {
          name,
          email,
          password: config.admin_password,
          uid: await generateUID(),
          role: USER_ROLE.admin,
        },
      ],
      { session, new: true },
    );

    if (!createAdmin) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Dispatcher not created');
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllAdmin = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(User.find({ role: 'admin' }), query);

  const result = await queryBuilder
    .paginate()
    .search(['name', 'email'])
    .filter(['name', 'email'])
    .sort()
    .queryModel.sort();

  const meta = await queryBuilder.countTotal();
  // const result = await User.find({ role: USER_ROLE.admin });
  return { meta, result };
};

export const UserService = {
  updateUserActions,
  createAdmin,
  getAllCustomers,
  getAllAdmin,
};
