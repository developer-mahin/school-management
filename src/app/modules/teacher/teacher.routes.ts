import { Router } from 'express';
import { TeacherController } from './teacher.controller';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import validateRequest from '../../middleware/validation';
import { TeacherValidation } from './teacher.validation';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.admin, USER_ROLE.school, USER_ROLE.supperAdmin),
    validateRequest(TeacherValidation.teacherSchema),
    TeacherController.createTeacher,
  )
  .get(
    '/base_on_student',
    auth(USER_ROLE.student, USER_ROLE.parents),
    TeacherController.getBaseOnStudent,
  )
  .get(
    '/teacher_list',
    auth(USER_ROLE.supperAdmin, USER_ROLE.school, USER_ROLE.admin),
    TeacherController.getTeacherList,
  )
  .patch(
    '/edit_teacher/:teacherUserId',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
    TeacherController.editTeacher,
  )
  .delete(
    '/delete_teacher/:teacherUserId',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
    TeacherController.deleteTeacher,
  );

export const TeacherRoutes = router;
