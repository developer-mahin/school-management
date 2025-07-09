/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import { TTeacher } from '../teacher/teacher.interface';
import { createUserWithProfile } from '../user/user.helper';
import User from '../user/user.model';
import Manager from './manager.model';
import { TManager } from './manager.interface';
import AppError from '../../utils/AppError';
import httpStatus from 'http-status';

const createManager = async (
  payload: Partial<TTeacher & { phoneNumber: string | any; name?: string }>,
  user: TAuthUser,
) => {
  payload.schoolId = user.schoolId as any;

  const manager = await createUserWithProfile({
    phoneNumber: payload.phoneNumber,
    role: USER_ROLE.manager,
    data: payload,
  });

  const message = `New manager ${payload.name} joined ${new Date().toLocaleTimeString()}`;
  await sendNotification(user, {
    senderId: manager._id,
    role: user.role,
    receiverId: user.userId,
    message,
    type: NOTIFICATION_TYPE.MANAGER,
    linkId: manager._id,
  });

  return manager;
};

const getAllManager = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const managerQuery = new QueryBuilder(
    Manager.find({ schoolId: user.schoolId }).populate('userId'),
    query,
  );
  const result = await managerQuery.sort().search(['userId.name']).paginate()
    .queryModel;

  const meta = await managerQuery.countTotal();

  return { meta, result };
};

const updateManager = async (
  managerId: string,
  payload: Partial<TManager & { phoneNumber?: string | any; name?: string }>,
) => {
  const manager = await Manager.findById(managerId);
  if (!manager) throw new Error('Student not found');

  const userData = {
    name: payload.name,
    phoneNumber: payload.phoneNumber,
  };
  const managerData = {
    managerRole: payload.managerRole,
  };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updateStudent = await User.findOneAndUpdate({ managerId }, userData, {
      new: true,
      session,
    });

    if (!updateStudent) throw new Error('Student not update');

    await Manager.findOneAndUpdate({ _id: managerId }, managerData, {
      new: true,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    return updateStudent;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error);
  }
};

const deleteManager = async (managerId: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const student = await Manager.findByIdAndDelete(managerId, { session });
    if (!student) throw new Error('Student not found');

    await User.findOneAndDelete({ managerId: managerId }, { session });

    await session.commitTransaction();
    session.endSession();

    return student;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const ManagerService = {
  createManager,
  getAllManager,
  updateManager,
  deleteManager,
};
