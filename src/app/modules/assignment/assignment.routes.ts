import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { AssignmentController } from './assignment.controller';
import validateRequest from '../../middleware/validation';
import { AssignmentValidation } from './assignment.validation';
import fileUpload from '../../utils/uploadImage';
import parseFormData from '../../middleware/parsedData';

const upload = fileUpload('./public/uploads/files/');

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.teacher),
    upload.single('file'),
    parseFormData,
    validateRequest(AssignmentValidation.assignmentSchema),
    AssignmentController.createAssignment,
  )
  .get(
    '/active',
    auth(USER_ROLE.teacher),
    AssignmentController.getActiveAssignment,
  )
  .get(
    '/assignment_details/:assignmentId',
    auth(USER_ROLE.teacher),
    AssignmentController.getAssignmentDetails,
  );

export const AssignmentRoutes = router;
