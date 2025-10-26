import { model, Schema } from 'mongoose';
import { TMessage } from './message.interface';

const messageSchema = new Schema<TMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Conversation id is required'],
      ref: 'Conversation',
    },
    text_message: { type: String },
    file: { type: String },
    sender: {
      type: Schema.Types.ObjectId,
      required: [true, 'Sender is required'],
      ref: 'User',
    },
    isReadByReceiver: { type: Boolean, default: false },
    isReadBySender: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const Message = model<TMessage>('Message', messageSchema);

export default Message;
