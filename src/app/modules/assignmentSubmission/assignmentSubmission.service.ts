import { TAuthUser } from '../../interface/authUser';
import { TAssignmentSubmission } from './assignmentSubmission.interface';
import AssignmentSubmission from './assignmentSubmission.model';

const submitAssignment = async (
    payload: Partial<TAssignmentSubmission>,
    user: TAuthUser,
) => {
    const result = await AssignmentSubmission.create({
        ...payload,
        studentId: user.studentId
    });
    return result;

};

export const AssignmentSubmissionService = {
    submitAssignment,
};
