/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectedUser } from '.';
import { TAuthUser } from '../app/interface/authUser';
import { TNotification } from '../app/modules/notification/notification.interface';
import { NotificationService } from '../app/modules/notification/notification.service';
import { IO } from '../server';

const sendNotification = async (
  user: Partial<TAuthUser>,
  payload: TNotification | any,
) => {
  try {
    const { receiverId } = payload;
    const notificationData = {
      ...payload,
      senderId: user.userId,
      receiverId: receiverId,
    };

    delete notificationData?.jobInfo;

    const connectUser: any = connectedUser.get(receiverId.toString());
    if (connectUser) {
      IO.to(connectUser.socketId).emit('notification', {
        success: true,
        data: payload,
      });
    }

    await NotificationService.createNotification(notificationData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending notification:', error);
  }
};

export default sendNotification;
