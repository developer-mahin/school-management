import httpStatus from 'http-status';
import sendNotification from '../../../socket/sendNotification';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Assignment from '../assignment/assignment.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import School from '../school/school.model';
import { TAssignmentSubmission } from './assignmentSubmission.interface';
import AssignmentSubmission from './assignmentSubmission.model';

const submitAssignment = async (
  payload: Partial<TAssignmentSubmission>,
  user: TAuthUser,
) => {
  // Step 1: Parallel validation queries (Current approach - OPTIMAL)
  const [findSubmission, findAssignment] = await Promise.all([
    AssignmentSubmission.findOne({
      assignmentId: payload.assignmentId,
      studentId: user.studentId,
      userId: user.userId,
    }),
    Assignment.findById(payload.assignmentId),
  ]);

  // Step 2: Early validation (Must be sequential)
  if (findSubmission) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Assignment already submitted');
  }
  if (!findAssignment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Assignment not found');
  }

  // Step 3: Parallel operations (Current approach - OPTIMAL)
  const [result, findSchool] = await Promise.all([
    AssignmentSubmission.create({
      ...payload,
      studentId: user.studentId,
      userId: user.userId,
    }),
    School.findById(findAssignment.schoolId),
  ]);

  if (!findSchool) {
    throw new AppError(httpStatus.NOT_FOUND, 'School not found');
  }

  const receiverIds = [findAssignment.teacherId, user.mySchoolUserId];

  await Promise.all([
    receiverIds.map((receiverId) => {
      sendNotification(user, {
        senderId: user.userId,
        role: user.role,
        receiverId: receiverId,
        message: `${user.name} submitted assignment ${findAssignment.title}`,
        type: NOTIFICATION_TYPE.ASSIGNMENT_SUBMISSION,
        linkId: result._id,
        senderName: user.name,
      });
    }),
  ]);

  return result;
};

export const AssignmentSubmissionService = {
  submitAssignment,
};
