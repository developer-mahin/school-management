import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { NotificationService } from './notification.service';

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
  const result = await NotificationService.notificationSend(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notification sent successfully',
  });
});

const markAsRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAsRead(
    req.params.notificationId,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: { success: result.success },
  });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAllAsRead(
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: { modifiedCount: result.modifiedCount },
  });
});

export const NotificationController = {
  getNotifications,
  sendNotification,
  markAsRead,
  markAllAsRead,
};
