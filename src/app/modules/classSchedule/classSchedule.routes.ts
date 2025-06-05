import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { ClassScheduleController } from './classSchedule.controller';
import validateRequest from '../../middleware/validation';
import { ClassScheduleValidation } from './classSchedule.validation';

const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.school),
  validateRequest(ClassScheduleValidation.classScheduleSchema),
  ClassScheduleController.createClassSchedule,
)
  .get("/", auth(USER_ROLE.school), ClassScheduleController.getAllClassSchedule);
  
export const ClassScheduleRoutes = router;
