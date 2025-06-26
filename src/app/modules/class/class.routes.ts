import { Router } from 'express';
import { ClassController } from './class.controller';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';

const route = Router();

route
  .post('/create', auth(USER_ROLE.school), ClassController.createClass)
  .get(
    '/students_of_classes',
    auth(USER_ROLE.teacher),
    ClassController.getStudentsOfClasses,
  )
  .get(
    '/school',
    auth(USER_ROLE.supperAdmin, USER_ROLE.admin, USER_ROLE.school, USER_ROLE.teacher),
    ClassController.getClassBySchoolId,
  )
  .get(
    '/:levelId',
    auth(USER_ROLE.school, USER_ROLE.supperAdmin, USER_ROLE.school),
    ClassController.getAllClasses,
  )
  .get(
    '/school/section/:classId',
    auth(USER_ROLE.school, USER_ROLE.supperAdmin, USER_ROLE.admin, USER_ROLE.teacher),
    ClassController.getSectionsByClassId,
  )
  .patch('/:classId', auth(USER_ROLE.school), ClassController.updateClass)
  .delete('/:classId', auth(USER_ROLE.school), ClassController.deleteClass);

export const ClassRoutes = route;
