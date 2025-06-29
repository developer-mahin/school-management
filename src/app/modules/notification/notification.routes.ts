import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { NotificationController } from './notification.controller';

const router = Router();

router.get(
  '/',
  auth(
    USER_ROLE.admin,
    USER_ROLE.parents,
    USER_ROLE.school,
    USER_ROLE.student,
    USER_ROLE.supperAdmin,
    USER_ROLE.teacher,
  ),
  NotificationController.getNotifications,
);

export const NotificationRoutes = router;
