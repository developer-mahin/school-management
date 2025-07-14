import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { AnnouncementController } from './announcement.controller';
import validateRequest from '../../middleware/validation';
import { AnnouncementValidation } from './announcement.validation';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.school, USER_ROLE.manager),
    validateRequest(AnnouncementValidation.createAnnouncementValidation),
    AnnouncementController.createAnnouncement,
  )
  .get(
    '/',
    auth(
      USER_ROLE.student,
      USER_ROLE.parents,
      USER_ROLE.teacher,
      USER_ROLE.school,
      USER_ROLE.manager,
    ),
    AnnouncementController.getAllAnnouncements,
  );

export const AnnouncementRoutes = router;
