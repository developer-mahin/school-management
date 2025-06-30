import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import validateRequest from '../../middleware/validation';
import { StudentController } from './student.controller';
import { StudentValidation } from './student.validation';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
    validateRequest(StudentValidation.studentSchema),
    StudentController.createStudent,
  )
  .get(
    '/student_list',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
    StudentController.getAllStudents,
  )
  .get('/my_child', auth(USER_ROLE.parents), StudentController.getMyChildren)
  .get(
    '/select_child/:userId',
    auth(USER_ROLE.parents),
    StudentController.selectChild,
  )
  .patch(
    '/edit_student/:studentId',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
    StudentController.editStudent,
  )
  .delete("/delete_student/:studentId", auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school), StudentController.deleteStudent);

export const StudentRoutes = router;
