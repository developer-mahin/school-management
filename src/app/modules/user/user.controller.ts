import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';

const updateUserActions = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const result = await UserService.updateUserActions(id, action);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User updated successfully',
    data: result,
  });
});

const getAllCustomers = catchAsync(async (req, res) => {
  const result = await UserService.getAllCustomers(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'customers fetched successfully',
  });
});

const createAdmin = catchAsync(async (req, res) => {
  const result = await UserService.createAdmin(req.body);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'admin created successfully',
  });
});

const getAllAdmin = catchAsync(async (req, res) => {
  const result = await UserService.getAllAdmin(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'admin fetched successfully',
  });
});

export const UserController = {
  updateUserActions,
  createAdmin,
  getAllCustomers,
  getAllAdmin,
};
