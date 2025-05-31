import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ClassService } from './class.service';
import { TAuthUser } from '../../interface/authUser';

const createClass = catchAsync(async (req, res) => {
  const result = await ClassService.createClass(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Class created successfully',
    data: result,
  });
});

const getAllClasses = catchAsync(async (req, res) => {
  const result = await ClassService.getAllClasses(
    req.user as TAuthUser,
    req.params.levelId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Classes fetched successfully',
    data: result,
  });
});

export const ClassController = {
  createClass,
  getAllClasses,
};
