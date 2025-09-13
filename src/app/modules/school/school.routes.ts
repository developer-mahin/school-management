import { Router } from 'express';
import validateRequest from '../../middleware/validation';
import { SchoolController } from './school.controller';
import { SchoolValidation } from './school.velidation';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import fileUpload from '../../utils/uploadImage';
import parseFormData from '../../middleware/parsedData';

const upload = fileUpload('./public/uploads/images/');

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
  .get(
    '/result_of_students',
    auth(USER_ROLE.school),
    SchoolController.getResultOfStudents,
  )
  .get(
    '/school_profile',
    auth(USER_ROLE.school),
    SchoolController.getSchoolProfile,
  )
  .patch(
    '/update_school_profile',
    auth(USER_ROLE.school),
    upload.fields([
      { name: 'schoolImage', maxCount: 1 },
      { name: 'coverImage', maxCount: 1 },
    ]),
    parseFormData,
    SchoolController.updateSchoolProfile,
  )
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
