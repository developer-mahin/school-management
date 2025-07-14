import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import Message from '../message/message.mode';
import Conversation from './conversation.model';

const createConversation = async (
  data: { receiverId: string },
  user: TAuthUser,
) => {
  let result;
  result = await Conversation.findOne({
    users: { $all: [user.userId, data.receiverId], $size: 2 },
  });

  if (!result) {
    result = await Conversation.create({
      users: [user.userId, data.receiverId],
    });
  }

  return result;
};

const getConversations = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const conversationAggregation = new AggregationQueryBuilder(query);

  const result = await conversationAggregation
    .customPipeline([
      {
        $match: {
          users: {
            $in: [new mongoose.Types.ObjectId(String(user.userId))],
          },
        },
      },
      {
        $lookup: {
          from: 'messages',
          let: { convId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$conversationId', '$$convId'] },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: 'lastMessage',
        },
      },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          let: { userIds: '$users' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', '$$userIds'],
                },
              },
            },
          ],
          as: 'allUsers',
        },
      },
      {
        $addFields: {
          self: {
            $first: {
              $filter: {
                input: '$allUsers',
                as: 'u',
                cond: {
                  $eq: [
                    '$$u._id',
                    new mongoose.Types.ObjectId(String(user.userId)),
                  ],
                },
              },
            },
          },
          otherUser: {
            $first: {
              $filter: {
                input: '$allUsers',
                as: 'u',
                cond: {
                  $ne: [
                    '$$u._id',
                    new mongoose.Types.ObjectId(String(user.userId)),
                  ],
                },
              },
            },
          },
        },
      },

      {
        $project: {
          users: 0,
          allUsers: 0,
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          lastMessage: 1,
          self: {
            _id: '$self._id',
            name: '$self.name',
            image: '$self.image',
            relation: '$self.relation',
          },
          otherUser: {
            _id: '$otherUser._id',
            name: '$otherUser.name',
            image: '$otherUser.image',
            relation: '$otherUser.relation',
          },
        },
      },
    ])
    .sort()
    // .paginate()
    .search(['self.name', 'otherUser.name'])
    .execute(Conversation);

  const meta = await conversationAggregation.countTotal(Conversation);

  return { meta, result };
};

const getMessages = async (
  conversationId: string,
  query: Record<string, unknown>,
) => {
  const messageAggregation = new AggregationQueryBuilder(query);

  await Message.updateMany(
    { conversationId: conversationId, isRead: false },
    { $set: { isRead: true } },
  );

  const result = await messageAggregation
    .customPipeline([
      {
        $match: {
          conversationId: new mongoose.Types.ObjectId(String(conversationId)),
        },
      },
      {
        $lookup: {
          from: 'conversations',
          localField: 'conversationId',
          foreignField: '_id',
          as: 'conversation',
        },
      },
      {
        $unwind: '$conversation',
      },
      {
        $addFields: {
          otherUsers: {
            $filter: {
              input: '$conversation.users',
              as: 'user',
              cond: {
                $ne: ['$$user', '$sender'],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'otherUsers',
          foreignField: '_id',
          as: 'otherUserInfo',
        },
      },
      {
        $unwind: {
          path: '$otherUserInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          sender: 1,
          text_message: 1,
          file: 1,
          isRead: 1,
          conversationId: 1,
          otherUser: {
            _id: '$otherUserInfo._id',
            name: '$otherUserInfo.name',
            image: '$otherUserInfo.image',
            role: '$otherUserInfo.role',
          },
        },
      },
    ])
    .sort()
    .paginate()
    .search(['text_message'])
    .execute(Message);

  const meta = await messageAggregation.countTotal(Message);

  return { meta, result };
};

export const ConversationService = {
  createConversation,
  getConversations,
  getMessages,
};
