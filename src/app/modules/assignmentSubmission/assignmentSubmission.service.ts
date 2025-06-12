import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import { TAssignmentSubmission } from './assignmentSubmission.interface';
import AssignmentSubmission from './assignmentSubmission.model';
import AppError from '../../utils/AppError';

const submitAssignment = async (
  payload: Partial<TAssignmentSubmission>,
  user: TAuthUser,
) => {

  const findSubmission = await AssignmentSubmission.findOne({
    assignmentId: payload.assignmentId,
    studentId: user.studentId,
    userId: user.userId,
  })

  if (findSubmission) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Assignment already submitted');
  }

  const result = await AssignmentSubmission.create({
    ...payload,
    studentId: user.studentId,
    userId: user.userId,
  });
  return result;
};

export const AssignmentSubmissionService = {
  submitAssignment,
};
