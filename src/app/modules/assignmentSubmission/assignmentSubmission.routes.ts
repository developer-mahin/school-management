import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { AssignmentSubmissionController } from './assignmentSubmission.controller';
import fileUpload from '../../utils/uploadImage';
import parseFormData from '../../middleware/parsedData';

const upload = fileUpload('./public/uploads/files/');

const router = Router();

router.post(
  '/submit',
  auth(USER_ROLE.student),
  upload.single('file'),
  parseFormData,
  AssignmentSubmissionController.submitAssignment,
);

export const AssignmentSubmissionRoutes = router;
