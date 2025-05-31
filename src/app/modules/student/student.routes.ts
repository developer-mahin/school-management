import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { StudentController } from './student.controller';
import { StudentValidation } from './student.validation';
import validateRequest from '../../middleware/validation';

const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
  validateRequest(StudentValidation.studentSchema),
  StudentController.createStudent,
);
// .get("/", auth(USER_ROLE.school), StudentController.getAllStudents)

export const StudentRoutes = router;
