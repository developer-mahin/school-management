/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload, Secret } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { USER_ROLE } from '../app/constant';
import { TAuthUser } from '../app/interface/authUser';
import { TMessage } from '../app/modules/message/message.interface';
import { MessageService } from '../app/modules/message/message.service';
import { NOTIFICATION_TYPE } from '../app/modules/notification/notification.interface';
import { SubscriptionService } from '../app/modules/subscription/subscription.service';
import User from '../app/modules/user/user.model';
import AppError from '../app/utils/AppError';
import { decodeToken } from '../app/utils/decodeToken';
import config from '../config';
import sendNotification from './sendNotification';

export interface IConnectedUser {
  socketId: string;
  userId: string; // You can add other properties that `connectUser` may have
  activeConversation?: string; // Track which conversation user is currently viewing
}
export const connectedUser: Map<string, IConnectedUser> = new Map();

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
      activeUsers[socket.id] = user?.userId;
      socket.user = { userId: user?.userId, socketId: socket?.id };
      // Attach user info to the socket object

      if (!user?.userId) throw new Error('User not found in JWT payload');

      if (
        socket?.user?.userId === undefined ||
        socket?.user?.socketId === undefined
      ) {
        // eslint-disable-next-line no-console
        console.log('userId or socketId is undefined');
        return;
      }
      next();
    } catch (err) {
      console.log(' err ================>', err);
      // eslint-disable-next-line no-console
      connectedUser.delete(socket?.user?.userId);
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
      socket?.user?.socketId === undefined
    ) {
      // eslint-disable-next-line no-console
      console.log('userId or socketId is undefined');
      return;
    }
    connectedUser.set(socket?.user?.userId, {
      socketId: socket?.user?.socketId,
      userId: socket?.user?.userId,
    });

    io.emit('online_users', Array.from(connectedUser.keys()));

    // sending message
    socket.on(
      'send_message',
      async (payload: Partial<TMessage & { receiverId: string }>, callback) => {
        try {
          if (!payload.conversationId) {
            return callback?.({ success: false, message: 'Invalid payload' });
          }

          if (user?.role === USER_ROLE.parents) {
            const subscription = await SubscriptionService.getMySubscription(
              user as TAuthUser,
            );
            if (
              Object.keys(subscription || {}).length === 0 ||
              subscription.canChat === false
            ) {
              throw new AppError(
                700,
                'You need an active subscription to send messages',
              );
            }
          }

          const savedMessage = await MessageService.createMessage(payload);

          io.emit(`receive_message::${payload.conversationId}`, savedMessage);

          callback?.({
            success: true,
            message: 'Message sent successfully',
            data: savedMessage,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const receiver: any = connectedUser.get(
            payload!.receiverId!.toString(),
          );

          const sender: any = connectedUser.get(payload!.sender!.toString());

          // Check if both users are online for real-time read status
          const bothUsersOnline = receiver && sender;

          if (receiver) {
            console.log(receiver.socketId, 'receiver is socket id');
            io.to(receiver.socketId).emit('new_message', {
              success: true,
              data: savedMessage,
              bothUsersOnline,
            });

            io.emit(`new_message::${payload.receiverId}`, {
              success: true,
              data: savedMessage,
              bothUsersOnline,
            });

            // If both users are online, mark message as read in real-time
            if (bothUsersOnline && payload.receiverId) {
              await MessageService.markMessagesAsReadRealTime(
                payload.conversationId.toString(),
                payload.receiverId.toString()
              );

              // Notify sender that message was read
              io.to(sender.socketId).emit('message_read_realtime', {
                conversationId: payload.conversationId,
                messageId: savedMessage._id,
                readBy: payload.receiverId,
              });
            }
          }

          if (sender) {
            console.log(sender.socketId, 'sender');
            io.to(sender.socketId).emit('new_message', {
              success: true,
              data: savedMessage,
              bothUsersOnline,
            });

            io.emit(`new_message::${payload.sender}`, {
              success: true,
              data: savedMessage,
              bothUsersOnline,
            });
          }

          const findUser = await User.findById(payload.receiverId);

          if (findUser) {
            // Check if receiver is viewing this conversation
            const receiverConnInfo: any = connectedUser.get(payload.receiverId?.toString() || '');
            const isReceiverViewingConversation = receiverConnInfo?.activeConversation === payload.conversationId?.toString();

            // Only send notification if:
            // 1. Both users are NOT online together, OR
            // 2. Receiver is online but NOT viewing this specific conversation
            const shouldSendNotification = !bothUsersOnline || !isReceiverViewingConversation;

            if (shouldSendNotification) {
              const notificationData = {
                ...payload,
                message: `You have a new message from ${user?.name}`,
                role: findUser.role,
                type: NOTIFICATION_TYPE.MESSAGE,
                linkId: payload.conversationId,
                senderId: payload.sender,
                receiverId: payload.receiverId,
              };

              await sendNotification(user as TAuthUser, notificationData);
            }
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

    // Handle real-time message read status updates
    socket.on('mark_messages_read', async (payload: { conversationId: string }, callback) => {
      try {
        const { conversationId } = payload;
        const currentUserId = socket.user?.userId;

        if (!conversationId || !currentUserId) {
          return callback?.({ success: false, message: 'Invalid payload' });
        }

        // Mark messages as read for the current user
        const result = await MessageService.markMessagesAsRead(conversationId, currentUserId);

        // Notify the other user in the conversation that messages have been read
        const conversation = await MessageService.getConversationUsers(conversationId);
        if (conversation) {
          const otherUserId = conversation.users.find(id => id.toString() !== currentUserId);
          if (otherUserId) {
            const otherUser: any = connectedUser.get(otherUserId.toString());
            if (otherUser) {
              io.to(otherUser.socketId).emit('messages_read', {
                conversationId,
                readBy: currentUserId,
                unreadCount: result.unreadCount
              });
            }
          }
        }

        callback?.({
          success: true,
          message: 'Messages marked as read',
          data: result
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        callback?.({ success: false, message: 'Internal server error' });
      }
    });

    // Handle user joining a conversation (for real-time read status)
    socket.on('join_conversation', async (payload: { conversationId: string }, callback) => {
      try {
        const { conversationId } = payload;
        const currentUserId = socket.user?.userId;

        if (!conversationId || !currentUserId) {
          return callback?.({ success: false, message: 'Invalid payload' });
        }

        // Join the conversation room
        socket.join(`conversation_${conversationId}`);

        // Track that user is viewing this conversation
        const userConnInfo = connectedUser.get(currentUserId);
        if (userConnInfo) {
          userConnInfo.activeConversation = conversationId;
        }

        // Check if both users are online and mark messages as read in real-time
        const conversation = await MessageService.getConversationUsers(conversationId);
        if (conversation) {
          const otherUserId = conversation.users.find(id => id.toString() !== currentUserId);
          if (otherUserId) {
            const otherUser: any = connectedUser.get(otherUserId.toString());
            const currentUser: any = connectedUser.get(currentUserId);

            // If both users are online, mark messages as read in real-time
            if (otherUser && currentUser) {
              await MessageService.markMessagesAsReadRealTime(conversationId, currentUserId);

              // Notify both users about the read status
              io.to(`conversation_${conversationId}`).emit('conversation_active', {
                conversationId,
                bothUsersOnline: true,
                readBy: currentUserId
              });
            }
          }
        }

        callback?.({
          success: true,
          message: 'Joined conversation successfully'
        });
      } catch (error) {
        console.error('Error joining conversation:', error);
        callback?.({ success: false, message: 'Internal server error' });
      }
    });

    // Handle user leaving a conversation
    socket.on('leave_conversation', async (payload: { conversationId: string }, callback) => {
      try {
        const { conversationId } = payload;
        const currentUserId = socket.user?.userId;

        socket.leave(`conversation_${conversationId}`);

        // Clear active conversation tracking
        if (currentUserId) {
          const userConnInfo = connectedUser.get(currentUserId);
          if (userConnInfo && userConnInfo.activeConversation === conversationId) {
            userConnInfo.activeConversation = undefined;
          }
        }

        callback?.({
          success: true,
          message: 'Left conversation successfully'
        });
      } catch (error) {
        console.error('Error leaving conversation:', error);
        callback?.({ success: false, message: 'Internal server error' });
      }
    });

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log('Socket disconnected', socket.id);
      // You can remove the user from active users if needed
      delete activeUsers[socket.id];
      if (
        socket?.user?.userId === undefined ||
        socket?.user?.socketId === undefined
      ) {
        // eslint-disable-next-line no-console
        console.log('userId or socketId is undefined');
        return;
      }
      connectedUser.delete(socket?.user?.userId);
      io.emit('online_users', Array.from(connectedUser.keys()));
    });

    socket.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Socket error:', err);
    });
  });
};

export default socketIO;
