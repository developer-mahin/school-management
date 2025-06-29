import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { SubjectController } from './subject.controller';

const router = Router();

router
  .post('/create', auth(USER_ROLE.school), SubjectController.createSubject)
  .get(
    '/',
    auth(USER_ROLE.school, USER_ROLE.teacher),
    SubjectController.getSubject,
  )
  .patch('/action', auth(USER_ROLE.school), SubjectController.updateSubject)
  .delete(
    '/:subjectId',
    auth(USER_ROLE.school),
    SubjectController.deleteSubject,
  );

export const SubjectRoutes = router;
