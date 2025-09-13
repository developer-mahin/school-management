import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { ClassScheduleController } from './classSchedule.controller';
import validateRequest from '../../middleware/validation';
import { ClassScheduleValidation } from './classSchedule.validation';
import fileUpload from '../../utils/uploadImage';

const upload = fileUpload('./public/uploads/files/');

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.school, USER_ROLE.manager),
    validateRequest(ClassScheduleValidation.classScheduleSchema),
    ClassScheduleController.createClassSchedule,
  )
  .post(
    '/create_class_schedule_xlsx',
    auth(USER_ROLE.school),
    upload.single('file'),
    ClassScheduleController.createClassScheduleXlsx,
  )
  .get(
    '/',
    auth(USER_ROLE.school, USER_ROLE.manager),
    ClassScheduleController.getAllClassSchedule,
  )
  .get(
    '/schedule_by_days',
    auth(USER_ROLE.school, USER_ROLE.teacher, USER_ROLE.student),
    ClassScheduleController.getClassScheduleByDays,
  )
  .get(
    '/upcoming_classes',
    auth(USER_ROLE.school, USER_ROLE.teacher, USER_ROLE.student),
    ClassScheduleController.getUpcomingClasses,
  )
  .get(
    '/weekly_schedule',
    auth(USER_ROLE.teacher, USER_ROLE.student),
    ClassScheduleController.getWeeklySchedule,
  )
  .get(
    '/upcoming_classes/:classScheduleId',
    auth(USER_ROLE.school, USER_ROLE.teacher),
    ClassScheduleController.getUpcomingClassesByClassScheduleId,
  )
  .patch(
    '/update/:classScheduleId',
    auth(USER_ROLE.school),
    ClassScheduleController.updateClassSchedule,
  )
  .delete(
    '/delete/:classScheduleId',
    auth(USER_ROLE.school),
    ClassScheduleController.deleteClassSchedule,
  );

export const ClassScheduleRoutes = router;
