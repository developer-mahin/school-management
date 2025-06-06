import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ClassScheduleService } from './classSchedule.service';
import { TAuthUser } from '../../interface/authUser';

const createClassSchedule = catchAsync(async (req, res) => {
  const result = await ClassScheduleService.createClassSchedule(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Class Schedule created successfully',
    data: result,
  });
});

const getAllClassSchedule = catchAsync(async (req, res) => {
  const result = await ClassScheduleService.getAllClassSchedule(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class Schedule fetched successfully',
    data: result,
  });
});

const updateClassSchedule = catchAsync(async (req, res) => {
  const result = await ClassScheduleService.updateClassSchedule(
    req.params.classScheduleId,
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class Schedule updated successfully',
    data: result,
  });
});

const deleteClassSchedule = catchAsync(async (req, res) => {
  const result = await ClassScheduleService.deleteClassSchedule(
    req.params.classScheduleId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class Schedule deleted successfully',
    data: result,
  });
});

const getClassScheduleByDays = catchAsync(async (req, res) => {
  const result = await ClassScheduleService.getClassScheduleByDays(
    req.query,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class Schedule fetched successfully',
    data: result,
  });
});

const getUpcomingClasses = catchAsync(async (req, res) => {
  const result = await ClassScheduleService.getUpcomingClasses(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class Schedule fetched successfully',
    data: result,
  });
});

const getUpcomingClassesByClassScheduleId = catchAsync(async (req, res) => {
  const result = await ClassScheduleService.getUpcomingClassesByClassScheduleId(
    req.params.classScheduleId,
    req.user as TAuthUser
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class Schedule details fetched successfully',
    data: result,
  });
})

export const ClassScheduleController = {
  createClassSchedule,
  getAllClassSchedule,
  updateClassSchedule,
  deleteClassSchedule,
  getClassScheduleByDays,
  getUpcomingClasses, 
  getUpcomingClassesByClassScheduleId
};
