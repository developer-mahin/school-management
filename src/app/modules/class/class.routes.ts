import { Router } from 'express';
import { ClassController } from './class.controller';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';

const route = Router();

route
  .post('/create', auth(USER_ROLE.school), ClassController.createClass)
  .get(
    '/:levelId',
    auth(USER_ROLE.school, USER_ROLE.supperAdmin),
    ClassController.getAllClasses,
  );

export const ClassRoutes = route;
