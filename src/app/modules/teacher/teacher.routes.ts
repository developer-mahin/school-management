import { Router } from 'express';
import { TeacherController } from './teacher.controller';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';

const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.admin, USER_ROLE.school, USER_ROLE.supperAdmin),
  TeacherController.createTeacher,
);

export const TeacherRoutes = router;
