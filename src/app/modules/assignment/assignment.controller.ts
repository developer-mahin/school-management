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

export const AssignmentController = {
  createAssignment,
};
