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
  .get('/all_admin', auth(USER_ROLE.admin), UserController.getAllAdmin)
  .get("/count_total", auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school), UserController.countTotal)
  .get("/user_overview", auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school), UserController.userOverView)

export const UserRoutes = router;
