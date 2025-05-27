import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';
import { TAuthUser } from '../../interface/authUser';

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

const driverPerformance = catchAsync(async (req, res) => {
  const result = await UserService.driverPerformance(req.params.driverId);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'driver performance fetched successfully',
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

const getAllCompany = catchAsync(async (req, res) => {
  const result = await UserService.getAllCompany(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company fetched successfully',
  });
});

const companyDetails = catchAsync(async (req, res) => {
  const result = await UserService.companyDetails(req.params.companyId);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company details fetched successfully',
  });
});

const companyDispatchedHistory = catchAsync(async (req, res) => {
  const result = await UserService.companyDispatchedHistory(
    req.params.companyId,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company dispatched history fetched successfully',
  });
});

const getAllCompanyRequest = catchAsync(async (req, res) => {
  const result = await UserService.getAllCompanyRequest(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company request fetched successfully',
  });
});

const approveRequest = catchAsync(async (req, res) => {
  const result = await UserService.approveRequest(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company request updated successfully',
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

const getAllDriverRequest = catchAsync(async (req, res) => {
  const result = await UserService.getAllDriverRequest(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'driver request fetched successfully',
  });
});

const driverRequestAction = catchAsync(async (req, res) => {
  const result = await UserService.driverRequestAction(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'driver request action updated successfully',
  });
});

const customerOverview = catchAsync(async (req, res) => {
  const result = await UserService.customerOverview(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'customer overview fetched successfully',
  });
});

export const UserController = {
  updateUserActions,
  createAdmin,
  driverPerformance,
  getAllCustomers,
  getAllCompany,
  companyDetails,
  companyDispatchedHistory,
  getAllCompanyRequest,
  approveRequest,
  getAllAdmin,
  getAllDriverRequest,
  driverRequestAction,
  customerOverview,
};
