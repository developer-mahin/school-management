import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import validateRequest from '../../middleware/validation';
import { StudentController } from './student.controller';
import { StudentValidation } from './student.validation';

const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
  validateRequest(StudentValidation.studentSchema),
  StudentController.createStudent,
)
  .get("/uniqueId", StudentController.uniqueId)
  .get("/my_child", auth(USER_ROLE.parents), StudentController.getMyChildren)
  .get(
    '/select_child/:userId',
    auth(USER_ROLE.parents),
    StudentController.selectChild,
  )
// .get("/", auth(USER_ROLE.school), StudentController.getAllStudents)

export const StudentRoutes = router;
