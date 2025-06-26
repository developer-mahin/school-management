/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectedUser } from '.';
import { TAnnouncement } from '../app/modules/announcment/announcement.interface';
import { IO } from '../server';

const sendAnnouncement = async (payload: TAnnouncement | any) => {
  try {
    const { receiverId } = payload;

    const connectUser: any = connectedUser.get(receiverId.toString());
    if (connectUser) {
      IO.to(connectUser.socketId).emit('announcement', {
        success: true,
        data: payload,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending notification:', error);
  }
};

export default sendAnnouncement;
