import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { AssignmentSubmissionController } from './assignmentSubmission.controller';

const router = Router();

router.post(
  '/submit',
  auth(USER_ROLE.student),
  AssignmentSubmissionController.submitAssignment,
);

export const AssignmentSubmissionRoutes = router;
