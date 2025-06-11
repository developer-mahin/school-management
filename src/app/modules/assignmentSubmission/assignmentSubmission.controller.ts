import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TAuthUser } from '../../interface/authUser';
import { AssignmentSubmissionService } from './assignmentSubmission.service';

const submitAssignment = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.submittedFile = req.file.path;
  }

  const result = await AssignmentSubmissionService.submitAssignment(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Assignment submitted successfully',
    data: result,
  });
});

export const AssignmentSubmissionController = {
  submitAssignment,
};
