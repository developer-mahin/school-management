import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { NotificationController } from './notification.controller';

const router = Router();

router.get(
  '/',
  auth(
    USER_ROLE.customer,
    USER_ROLE.driver,
    USER_ROLE.dispatcher,
    USER_ROLE.company,
    USER_ROLE.hopperCompany,
    USER_ROLE.admin,
  ),
  NotificationController.getNotifications,
);

export const NotificationRoutes = router;
