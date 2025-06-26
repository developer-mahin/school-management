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
    auth(USER_ROLE.school),
    validateRequest(AnnouncementValidation.createAnnouncementValidation),
    AnnouncementController.createAnnouncement,
  )
  .get('/');

export const AnnouncementRoutes = router;
