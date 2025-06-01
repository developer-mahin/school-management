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
    auth(USER_ROLE.school),
    validateRequest(ExamValidation.ExamSchema),
    ExamController.createExam,
  )
  .get('/:termsId', auth(USER_ROLE.school), ExamController.getTermsExams)
  .patch('/:examId', auth(USER_ROLE.school), ExamController.updateExams)
  .delete('/:examId', auth(USER_ROLE.school), ExamController.deleteExams);

export const ExamRoutes = router;
