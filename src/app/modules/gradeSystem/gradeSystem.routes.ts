import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { GradeSystemController } from './gradeSystem.controller';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.school, USER_ROLE.manager),
    GradeSystemController.createGradeSystem,
  )
  .get(
    '/',
    auth(USER_ROLE.school, USER_ROLE.manager),
    GradeSystemController.getAllGradeSystem,
  )
  .patch(
    '/update/:gradeSystemId',
    auth(USER_ROLE.school),
    GradeSystemController.updateGradeSystem,
  )
  .delete(
    '/:gradeSystemId',
    auth(USER_ROLE.school),
    GradeSystemController.deleteGradeSystem,
  );

export const GradeSystemRoutes = router;
