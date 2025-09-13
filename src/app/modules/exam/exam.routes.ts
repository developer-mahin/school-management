import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import validateRequest from '../../middleware/validation';
import { ExamController } from './exam.controller';
import { ExamValidation } from './exam.validation';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.school, USER_ROLE.manager),
    validateRequest(ExamValidation.ExamSchema),
    ExamController.createExam,
  )
  .get(
    '/exam_of_teachers',
    auth(USER_ROLE.teacher),
    ExamController.getExamsOfTeacher,
  )
  .get(
    '/exam_schedule',
    auth(USER_ROLE.student),
    ExamController.getExamSchedule,
  )
  .patch(
    '/grade_update',
    auth(USER_ROLE.teacher, USER_ROLE.school),
    ExamController.updateGrade,
  )
  .patch('/update_result', auth(USER_ROLE.school), ExamController.updateResult)
  .get(
    '/grades_result/:examId',
    auth(USER_ROLE.teacher),
    ExamController.getGradesResult,
  )
  .get(
    '/:termsId',
    auth(USER_ROLE.school, USER_ROLE.manager),
    ExamController.getTermsExams,
  )
  .patch('/:examId', auth(USER_ROLE.school), ExamController.updateExams)
  .delete('/:examId', auth(USER_ROLE.school), ExamController.deleteExams);

export const ExamRoutes = router;
