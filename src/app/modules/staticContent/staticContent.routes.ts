import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { StaticContentController } from './staticContent.controller';
import validateRequest from '../../middleware/validation';
import { StaticContentValidation } from './staticContent.validation';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin),
    validateRequest(StaticContentValidation.staticContentValidation),
    StaticContentController.createStaticContent,
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
    StaticContentController.getStaticContent,
  );

export const StaticContentRoutes = router;
