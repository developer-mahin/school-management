import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { FeedbackService } from './feedback.service';
import { TAuthUser } from '../../interface/authUser';

const addFeedback = catchAsync(async (req, res) => {
  const { userId } = req.user as TAuthUser;
  const result = await FeedbackService.addFeedback(req.body, userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Feedback added successfully',
    data: result,
  });
});

export const FeedbackController = {
  addFeedback,
};
