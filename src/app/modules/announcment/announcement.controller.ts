import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AnnouncementService } from './announcement.service';

const createAnnouncement = catchAsync(async (req, res) => {
  const result = await AnnouncementService.createAnnouncement(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Announcement created successfully',
    data: result,
  });
});

const getAllAnnouncements = catchAsync(async (req, res) => {
  const result = await AnnouncementService.getAllAnnouncements(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Announcements fetched successfully',
    data: result,
  });
});

export const AnnouncementController = {
  createAnnouncement,
  getAllAnnouncements,
};
