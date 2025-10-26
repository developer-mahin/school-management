import mongoose from 'mongoose';
import Conversation from '../conversation/conversation.model';
import { TMessage } from './message.interface';
import Message from './message.mode';

const createMessage = async (payload: Partial<TMessage>) => {
  const result = await Message.create(payload);
  return result;
};

const markMessagesAsRead = async (conversationId: string, userId: string) => {
  const convObjectId = new mongoose.Types.ObjectId(conversationId);
  const currentUserId = new mongoose.Types.ObjectId(userId);

  // Mark messages as read for the current user
  const receiverResult = await Message.updateMany(
    {
      conversationId: convObjectId,
      sender: { $ne: currentUserId },
      isReadByReceiver: false,
    },
    { $set: { isReadByReceiver: true } },
  );

  const senderResult = await Message.updateMany(
    {
      conversationId: convObjectId,
      sender: currentUserId,
      isReadBySender: false,
    },
    { $set: { isReadBySender: true } },
  );

  const totalModified = receiverResult.modifiedCount + senderResult.modifiedCount;

  return {
    modifiedCount: totalModified,
    unreadCount: 0, // All messages are now read
  };
};

const markMessagesAsReadRealTime = async (conversationId: string, userId: string) => {
  const convObjectId = new mongoose.Types.ObjectId(conversationId);
  const currentUserId = new mongoose.Types.ObjectId(userId);

  // Mark messages as read in real-time (only messages sent by others)
  const result = await Message.updateMany(
    {
      conversationId: convObjectId,
      sender: { $ne: currentUserId },
      isReadByReceiver: false,
    },
    { $set: { isReadByReceiver: true } },
  );

  return result;
};

const getConversationUsers = async (conversationId: string) => {
  const convObjectId = new mongoose.Types.ObjectId(conversationId);
  const conversation = await Conversation.findById(convObjectId).select('users');
  return conversation;
};

export const MessageService = {
  createMessage,
  markMessagesAsRead,
  markMessagesAsReadRealTime,
  getConversationUsers,
};
