import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import { NotificationController } from './notification.controller';

const router = Router();

router
  .post(
    '/send_notification',
    auth(
      USER_ROLE.supperAdmin,
      USER_ROLE.admin,
      USER_ROLE.parents,
      USER_ROLE.teacher,
      USER_ROLE.student,
      USER_ROLE.school,
    ),
    NotificationController.sendNotification,
  )
  .get(
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
  )
  .patch(
    '/mark_read/:notificationId',
    auth(
      USER_ROLE.admin,
      USER_ROLE.parents,
      USER_ROLE.school,
      USER_ROLE.student,
      USER_ROLE.supperAdmin,
      USER_ROLE.teacher,
    ),
    NotificationController.markAsRead,
  )
  .patch(
    '/mark_all_read',
    auth(
      USER_ROLE.admin,
      USER_ROLE.parents,
      USER_ROLE.school,
      USER_ROLE.student,
      USER_ROLE.supperAdmin,
      USER_ROLE.teacher,
    ),
    NotificationController.markAllAsRead,
  );

export const NotificationRoutes = router;
