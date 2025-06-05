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
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class Schedule fetched successfully',
    data: result,
  });
});

export const ClassScheduleController = {
  createClassSchedule,
  getAllClassSchedule,

};
