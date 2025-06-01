import { Router } from 'express';
import validateRequest from '../../middleware/validation';
import { SchoolController } from './school.controller';
import { SchoolValidation } from './school.velidation';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';

const router = Router();

router
  .post(
    '/create',
    validateRequest(SchoolValidation.createSchoolValidation),
    SchoolController.createSchool,
  )
  .get(
    '/school_list',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin),
    SchoolController.getSchoolList,
  )
  .get('/teacher', auth(USER_ROLE.school), SchoolController.getTeachers);

export const SchoolRoutes = router;
