import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { LevelController } from './level.controller';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.school, USER_ROLE.manager),
    LevelController.createLevel,
  )
  .get(
    '/',
    auth(USER_ROLE.school, USER_ROLE.manager),
    LevelController.getAllLevels,
  )
  .patch('/:levelId', auth(USER_ROLE.school), LevelController.updateLevel)
  .delete('/:levelId', auth(USER_ROLE.school), LevelController.deleteLevel);

export const LevelRoutes = router;
