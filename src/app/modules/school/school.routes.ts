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
  .get('/all_students', auth(USER_ROLE.school), SchoolController.getAllStudents)
  .get('/teacher', auth(USER_ROLE.school), SchoolController.getTeachers)
  .patch(
    '/edit_school/:schoolId',
    auth(USER_ROLE.supperAdmin),
    SchoolController.editSchool,
  )
  .delete(
    '/delete_school/:schoolId',
    auth(USER_ROLE.supperAdmin),
    SchoolController.deleteSchool,
  );

export const SchoolRoutes = router;
