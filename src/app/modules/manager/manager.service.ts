/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import { transactionWrapper } from '../../utils/transactionWrapper';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import { TTeacher } from '../teacher/teacher.interface';
import { createUserWithProfile } from '../user/user.helper';
import User from '../user/user.model';
import { TManager } from './manager.interface';
import Manager from './manager.model';

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
    senderName: payload.name,
  });

  return manager;
};

const getAllManager = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const managerQuery = new AggregationQueryBuilder(query);

  const result = await managerQuery
    .customPipeline([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(user.schoolId)),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'managerId',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          schoolId: 1,
          managerRole: 1,
          userId: '$user._id',
          name: '$user.name',
          phoneNumber: '$user.phoneNumber',
          image: '$user.image',
          role: '$user.role',
          status: '$user.status',
        },
      },
    ])
    .search(['name'])
    .sort()
    .paginate()
    .execute(Manager);

  const meta = await managerQuery.countTotal(Manager);

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

  const result = transactionWrapper(async (session) => {
    const updateStudent = await User.findOneAndUpdate({ managerId }, userData, {
      new: true,
      session,
    });

    if (!updateStudent) throw new Error('Student not update');

    await Manager.findOneAndUpdate({ _id: managerId }, managerData, {
      new: true,
      session,
    });
  });

  return result;
};

const deleteManager = async (managerId: string) => {
  const result = transactionWrapper(async (session) => {
    const student = await Manager.findByIdAndDelete(managerId, { session });
    if (!student) throw new Error('Student not found');

    await User.findOneAndDelete({ managerId: managerId }, { session });
  });

  return result;
};

export const ManagerService = {
  createManager,
  getAllManager,
  updateManager,
  deleteManager,
};
