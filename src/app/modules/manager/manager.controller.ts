import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ManagerService } from './manager.service';

const createManager = catchAsync(async (req, res) => {
  const result = await ManagerService.createManager(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Manager created successfully',
  });
});

const getAllManager = catchAsync(async (req, res) => {
  const result = await ManagerService.getAllManager(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Manager fetched successfully',
  });
});

const updateManager = catchAsync(async (req, res) => {
  const result = await ManagerService.updateManager(
    req.params.managerId,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Manager updated successfully',
  });
});

const deleteManager = catchAsync(async (req, res) => {
  const result = await ManagerService.deleteManager(req.params.managerId);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Manager deleted successfully',
  });
});

export const ManagerController = {
  createManager,
  getAllManager,
  updateManager,
  deleteManager,
};
