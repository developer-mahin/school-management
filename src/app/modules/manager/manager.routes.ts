import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import { ManagerController } from './manager.controller';

const router = Router();

router
  .post(
    '/create_manager',
    auth(USER_ROLE.school),
    ManagerController.createManager,
  )
  .get('/all_manager', auth(USER_ROLE.school), ManagerController.getAllManager)
  .patch(
    '/update/:managerId',
    auth(USER_ROLE.school),
    ManagerController.updateManager,
  )
  .delete(
    '/delete/:managerId',
    auth(USER_ROLE.school),
    ManagerController.deleteManager,
  );

export const ManagerRoutes = router;
