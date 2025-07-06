import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { NotificationService } from './notification.service';
import { TAuthUser } from '../../interface/authUser';

const getNotifications = catchAsync(async (req, res) => {
  const result = await NotificationService.getNotifications(
    req.user as TAuthUser,
    req.query,
  );

  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notifications fetched successfully',
  });
});

const sendNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.notificationSend(req.body, req.user as TAuthUser);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notification sent successfully',
  });
});

export const NotificationController = {
  getNotifications,
  sendNotification
};
