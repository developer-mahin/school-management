import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import Notification from './notification.model';
import { NOTIFICATION_TYPE } from './notification.interface';
import sendNotification from '../../../socket/sendNotification';

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


const notificationSend = async (payload: { receiverId: string, message: string }, user: TAuthUser) => {

  const notificationBody = {
    ...payload,
    senderId: user.userId,
    role: user.role,
    type: NOTIFICATION_TYPE.CUSTOM,
    linkId: user.userId,
  }

  const result = await sendNotification(user, notificationBody);

  return result
};

export const NotificationService = {
  createNotification,
  getNotifications,
  notificationSend
};
