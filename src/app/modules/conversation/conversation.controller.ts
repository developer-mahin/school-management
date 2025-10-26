import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ConversationService } from './conversation.service';

const createConversation = catchAsync(async (req, res) => {
  const result = await ConversationService.createConversation(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Conversation created successfully',
    data: result,
  });
});

const getConversations = catchAsync(async (req, res) => {
  const result = await ConversationService.getConversations(
    req.user as TAuthUser,
    req.query,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Conversations fetched successfully',
    data: result,
  });
});

const getMessages = catchAsync(async (req, res) => {
  const result = await ConversationService.getMessages(
    req.params.conversationId,
    req.query,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Messages fetched successfully',
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const result = await ConversationService.markAllAsRead(
    req.params.conversationId,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: { modifiedCount: result.modifiedCount },
  });
});

export const ConversationController = {
  createConversation,
  getConversations,
  getMessages,
  markAllAsRead,
};
