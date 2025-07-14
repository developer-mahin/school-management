import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AssignmentService } from './assignment.service';

const createAssignment = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.fileUrl = req.file.path;
  }

  const result = await AssignmentService.createAssignment(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Assignment created successfully',
    data: result,
  });
});

const getActiveAssignment = catchAsync(async (req, res) => {
  const result = await AssignmentService.getActiveAssignment(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assignment fetched successfully',
    data: result,
  });
});

const getAssignmentDetails = catchAsync(async (req, res) => {
  const result = await AssignmentService.getAssignmentDetails(
    req.params.assignmentId,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assignment fetched successfully',
    data: result,
  });
});

const markAssignmentAsCompleted = catchAsync(async (req, res) => {
  const result = await AssignmentService.markAssignmentAsCompleted(
    req.params.assignmentId,
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assignment marked as completed successfully',
    data: result,
  });
});

const pendingAssignment = catchAsync(async (req, res) => {
  const result = await AssignmentService.pendingAssignment(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assignment fetched successfully',
    data: result,
  });
});

const getAllAssignment = catchAsync(async (req, res) => {
  const result = await AssignmentService.getAllAssignment(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assignment fetched successfully',
    data: result,
  });
});

const myAssignmentDetails = catchAsync(async (req, res) => {
  const result = await AssignmentService.myAssignmentDetails(
    req.params.assignmentId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Assignment fetched successfully',
    data: result,
  });
});

export const AssignmentController = {
  createAssignment,
  getActiveAssignment,
  getAssignmentDetails,
  markAssignmentAsCompleted,
  pendingAssignment,
  getAllAssignment,
  myAssignmentDetails,
};
