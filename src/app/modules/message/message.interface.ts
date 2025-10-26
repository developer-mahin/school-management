import { ObjectId } from 'mongoose';

export type TMessage = {
  conversationId: ObjectId;
  text_message?: string;
  file?: string;
  sender: ObjectId;
  isReadByReceiver: boolean;
  isReadBySender: boolean;
};
