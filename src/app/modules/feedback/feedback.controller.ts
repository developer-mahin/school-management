import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { FeedbackService } from './feedback.service';
import { TAuthUser } from '../../interface/authUser';

const addFeedback = catchAsync(async (req, res) => {
  const result = await FeedbackService.addFeedback(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Feedback added successfully',
    data: result,
  });
});

const getFeedbackList = catchAsync(async (req, res) => {
  const result = await FeedbackService.getFeedbackList(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Feedback list fetched successfully',
    data: result,
  });
});

export const FeedbackController = {
  addFeedback,
  getFeedbackList,
};
