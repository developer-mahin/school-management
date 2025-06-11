import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { UserController } from './user.controller';

const router = Router();

router
  .post(
    '/create_admin',
    auth(USER_ROLE.supperAdmin),
    UserController.createAdmin,
  )
  .get('/', auth(USER_ROLE.admin), UserController.getAllCustomers)
  .get('/all_admin', auth(USER_ROLE.admin), UserController.getAllAdmin);

export const UserRoutes = router;
