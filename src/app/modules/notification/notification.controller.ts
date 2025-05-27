import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { NotificationService } from './notification.service';

const getNotifications = catchAsync(async (req, res) => {
  const result = await NotificationService.getNotifications(
    req.user.notificationId,
    req.query,
  );

  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notifications fetched successfully',
  });
});

export const NotificationController = {
  getNotifications,
};
