import { JwtPayload, Secret } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { TAuthUser } from '../app/interface/authUser';
import { TMessage } from '../app/modules/message/message.interface';
import { MessageService } from '../app/modules/message/message.service';
import User from '../app/modules/user/user.model';
import { decodeToken } from '../app/utils/decodeToken';
import config from '../config';

export interface IConnectedUser {
  socketId: string;
  userId: string; // You can add other properties that `connectUser` may have
}
export const connectedUser: Map<string, object> = new Map();

const socketIO = (io: Server) => {
  // Initialize an object to store the active users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeUsers: { [key: string]: any } = {};

  let user: JwtPayload | undefined | TAuthUser = undefined;

  // Middleware to handle JWT authentication
  io.use(async (socket: Socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.token ||
      socket.handshake.headers.authorization;


    if (!token) {
      return next(new Error('Authentication error: Token not provided.'));
    }
    try {
      user = decodeToken(
        token,
        config.jwt.access_token as Secret,
      ) as JwtPayload;
      activeUsers[socket.id] = user.userId;
      socket.user = { userId: user.userId, socketId: socket.id };
      // Attach user info to the socket object
      if (
        socket.user.userId === undefined ||
        socket.user.socketId === undefined
      ) {
        // eslint-disable-next-line no-console
        console.log('userId or socketId is undefined');
        return;
      }
      next();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('JWT Verification Error:', err);
      return next(new Error('Authentication error: Invalid token.'));
    }
  });

  // On new socket connection
  io.on('connection', (socket: Socket) => {
    // eslint-disable-next-line no-console
    console.log('connected', socket.id);
    if (
      socket?.user?.userId === undefined ||
      socket.user.socketId === undefined
    ) {
      // eslint-disable-next-line no-console
      console.log('userId or socketId is undefined');
      return;
    }
    connectedUser.set(socket.user.userId, { socketId: socket.user.socketId });

    io.emit('online_users', Array.from(connectedUser.keys()));

    // sending message
    socket.on(
      'send_message',
      async (payload: Partial<TMessage & { receiverId: string }>, callback) => {
        try {
          if (!payload.conversationId || !payload.text_message) {
            return callback?.({ success: false, message: 'Invalid payload' });
          }

          const savedMessage = await MessageService.createMessage(payload);

          io.emit(`receive_message::${payload.conversationId}`, savedMessage);

          callback?.({
            success: true,
            message: 'Message sent successfully',
            data: savedMessage,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const connectUser: any = connectedUser.get(
            payload!.receiverId!.toString(),
          );

          if (connectUser) {
            io.to(connectUser.socketId).emit('new_message', {
              success: true,
              data: savedMessage,
            });
          }
        } catch (error) {
          console.error('Error sending message:', error);
          callback?.({ success: false, message: 'Internal server error' });
        }
      },
    );

    socket.on('typing', async (payload, callback) => {
      if (payload.status === true) {
        io.emit(`typing::${payload.receiverId}`, true);
        callback({ success: true, message: payload, result: payload });
      } else {
        io.emit(`typing::${payload.receiverId}`, false);
        callback({ success: false, message: payload, result: payload });
      }
    });

    // Handle user location updates
    // Buffer to store location data
    const locationBuffer = [];
    const LOCATION_LIMIT = 30;
    let lastUpdateTime = Date.now();

    socket.on('client_location', async (data, callback) => {
      const longitude = Number(data.lang);
      const latitude = Number(data.lat);
      locationBuffer.push({ longitude, latitude });

      if (locationBuffer.length >= LOCATION_LIMIT) {
        const currentTime = Date.now();
        const timeElapsed = currentTime - lastUpdateTime;
        if (timeElapsed >= 30 * 1000) {
          try {
            await User.findByIdAndUpdate(
              socket.user.userId,
              { $set: { 'location.coordinates': [longitude, latitude] } },
              { new: true },
            );

            locationBuffer.length = 0;
            lastUpdateTime = Date.now();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            // eslint-disable-next-line no-console
            console.error('Error updating the database:', error.message);
          }
        } else {
          // eslint-disable-next-line no-console
          console.log(
            `Waiting for 1 minute. Time remaining: ${30 - Math.floor(timeElapsed / 1000)
            } seconds`,
          );
        }
      }
      callback({ success: true, message: 'user data', result: data });
      // io.emit(`server_location::${user?._id?.toString()}`, data);
      io.emit(`server_location::${user?.userId.toString()}`, data);
      socket.emit(`server_location::${user?.userId.toString()}`, data);
    });

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log('Socket disconnected', socket.id);
      // You can remove the user from active users if needed
      delete activeUsers[socket.id];
      if (
        socket?.user?.userId === undefined ||
        socket.user.socketId === undefined
      ) {
        // eslint-disable-next-line no-console
        console.log('userId or socketId is undefined');
        return;
      }
      connectedUser.delete(socket.user.userId);
    });

    socket.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Socket error:', err);
    });
  });
};

export default socketIO;
