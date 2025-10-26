import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import { NOTIFICATION_TYPE } from './notification.interface';
import Notification from './notification.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createNotification = async (payload: any) => {
  const notification = new Notification(payload);
  await notification.save();
  return notification;
};

const getNotifications = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const notificationQuery = new AggregationQueryBuilder(query);

  const result = await notificationQuery
    .customPipeline([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(String(user.userId)),
        },
      },
    ])
    .sort()
    .paginate()
    .execute(Notification);

  const meta = await notificationQuery.countTotal(Notification);
  return { meta, result };
};

const notificationSend = async (
  payload: { receiverId: string; message: string },
  user: TAuthUser,
) => {
  const notificationBody = {
    ...payload,
    senderId: user.userId,
    role: user.role,
    type: NOTIFICATION_TYPE.CUSTOM,
    linkId: user.userId,
  };

  const result = await sendNotification(user, notificationBody);

  return result;
};

const markAsRead = async (notificationId: string, user: TAuthUser) => {
  const result = await Notification.updateOne(
    {
      _id: notificationId,
      receiverId: user.userId,
    },
    { $set: { isRead: true } },
  );

  if (result.modifiedCount === 0) {
    throw new Error('Notification not found or access denied');
  }

  return {
    success: true,
    message: 'Notification marked as read successfully',
  };
};

const markAllAsRead = async (user: TAuthUser) => {
  const result = await Notification.updateMany(
    {
      receiverId: user.userId,
      isRead: false,
    },
    { $set: { isRead: true } },
  );

  return {
    modifiedCount: result.modifiedCount,
    message: 'All notifications marked as read successfully',
  };
};

const getUnreadCount = async (receiverId: string) => {
  const count = await Notification.countDocuments({
    receiverId: new mongoose.Types.ObjectId(receiverId),
    isRead: false,
  });

  return count;
};

export const NotificationService = {
  createNotification,
  getNotifications,
  notificationSend,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
