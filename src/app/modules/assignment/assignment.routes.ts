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
    '/all_assignment',
    auth(USER_ROLE.school, USER_ROLE.manager),
    AssignmentController.getAllAssignment,
  )
  .get(
    '/my_assignment_details/:assignmentId',
    auth(USER_ROLE.student),
    AssignmentController.myAssignmentDetails,
  )
  .get(
    '/active',
    auth(USER_ROLE.teacher),
    AssignmentController.getActiveAssignment,
  )
  .get(
    '/pending_and_submitted_assignment',
    auth(USER_ROLE.student),
    AssignmentController.pendingAssignment,
  )
  .get(
    '/assignment_details/:assignmentId',
    auth(USER_ROLE.teacher),
    AssignmentController.getAssignmentDetails,
  )
  .patch(
    '/mark_as_completed/:assignmentId',
    auth(USER_ROLE.teacher),
    AssignmentController.markAssignmentAsCompleted,
  );

export const AssignmentRoutes = router;
