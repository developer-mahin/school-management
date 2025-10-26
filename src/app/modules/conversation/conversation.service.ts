import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import Message from '../message/message.mode';
import { SubscriptionService } from '../subscription/subscription.service';
import Conversation from './conversation.model';
const { ObjectId } = mongoose.Types;

const createConversation = async (
  data: { receiverId: string },
  user: TAuthUser,
) => {
  let result;

  const subscription = await SubscriptionService.getMySubscription(user);
  if (user.role === USER_ROLE.parents) {
    if (
      Object.keys(subscription || {}).length === 0 ||
      subscription.canChat === false
    ) {
      throw new AppError(
        700,
        'You need an active subscription to create a conversation',
      );
    }
  }

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
          from: 'messages',
          let: { convId: '$_id', currentUserId: new mongoose.Types.ObjectId(String(user.userId)) },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$conversationId', '$$convId'] }
              },
            },
            {
              $addFields: {
                isUnreadForMe: {
                  $cond: {
                    if: { $eq: ['$sender', '$$currentUserId'] },
                    then: { $not: '$isReadBySender' },
                    else: { $not: '$isReadByReceiver' }
                  }
                },
                isUnreadForOther: {
                  $cond: {
                    if: { $eq: ['$sender', '$$currentUserId'] },
                    then: { $not: '$isReadByReceiver' },
                    else: { $not: '$isReadBySender' }
                  }
                }
              }
            },
            {
              $group: {
                _id: null,
                myUnreadCount: {
                  $sum: {
                    $cond: ['$isUnreadForMe', 1, 0]
                  }
                },
                otherUnreadCount: {
                  $sum: {
                    $cond: ['$isUnreadForOther', 1, 0]
                  }
                }
              }
            }
          ],
          as: 'unreadCounts',
        },
      },
      {
        $addFields: {
          myUnreadCount: {
            $ifNull: [{ $arrayElemAt: ['$unreadCounts.myUnreadCount', 0] }, 0],
          },
          otherUnreadCount: {
            $ifNull: [{ $arrayElemAt: ['$unreadCounts.otherUnreadCount', 0] }, 0],
          },
        },
      },
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
          unreadCounts: 0,
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          lastMessage: 1,
          myUnreadCount: 1,
          otherUnreadCount: 1,
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
  user: TAuthUser,
) => {
  const convObjectId = new ObjectId(conversationId);
  const currentUserId = new ObjectId(user.userId);
  const messageAggregation = new AggregationQueryBuilder(query);

  // ✅ Mark all messages as read based on sender/receiver
  await Message.updateMany(
    {
      conversationId: convObjectId,
      sender: { $ne: currentUserId }
    },
    { $set: { isReadByReceiver: true } },
  );

  await Message.updateMany(
    {
      conversationId: convObjectId,
      sender: currentUserId
    },
    { $set: { isReadBySender: true } },
  );

  // ✅ Get paginated messages
  const result = await messageAggregation
    .customPipeline([
      { $match: { conversationId: convObjectId } },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          sender: 1,
          text_message: 1,
          file: 1,
          isReadByReceiver: 1,
          isReadBySender: 1,
          conversationId: 1,
        },
      },
    ])
    .sort()
    .paginate()
    .search(['text_message'])
    .execute(Message);

  // ✅ Get total count
  const meta = await messageAggregation.countTotal(Message);

  // ✅ Fetch the other user (optimized)
  const [otherUser] = await Conversation.aggregate([
    { $match: { _id: convObjectId } },
    { $unwind: '$users' },
    { $match: { users: { $ne: currentUserId } } },
    {
      $lookup: {
        from: 'users',
        localField: 'users',
        foreignField: '_id',
        as: 'otherUser',
      },
    },
    { $unwind: '$otherUser' },
    {
      $project: {
        _id: 0,
        otherUser: {
          _id: '$otherUser._id',
          name: '$otherUser.name',
          email: '$otherUser.email',
          image: '$otherUser.image',
          role: '$otherUser.role',
        },
      },
    },
    { $limit: 1 }, // Optional for safety
  ]);

  return {
    meta,
    result,
    othersUser: otherUser?.otherUser || null,
  };
};

const markAllAsRead = async (
  conversationId: string,
  user: TAuthUser,
) => {
  const convObjectId = new ObjectId(conversationId);
  const currentUserId = new ObjectId(user.userId);

  // Verify the user is part of this conversation
  const conversation = await Conversation.findOne({
    _id: convObjectId,
    users: { $in: [currentUserId] },
  });

  if (!conversation) {
    throw new AppError(404, 'Conversation not found or access denied');
  }

  // Mark all unread messages as read based on sender/receiver
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
    message: 'All messages marked as read successfully',
  };
};

export const ConversationService = {
  createConversation,
  getConversations,
  getMessages,
  markAllAsRead,
};
