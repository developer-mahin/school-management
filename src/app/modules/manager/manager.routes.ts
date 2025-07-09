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
  .get('/all_manager', auth(USER_ROLE.admin), ManagerController.getAllManager)
  .patch('/:managerId', auth(USER_ROLE.admin), ManagerController.updateManager)
  .delete(
    '/:managerId',
    auth(USER_ROLE.admin),
    ManagerController.deleteManager,
  );

export const ManagerRoutes = router;
