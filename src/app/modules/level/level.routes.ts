import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { LevelController } from './level.controller';

const router = Router();

router
  .post('/create', auth(USER_ROLE.school), LevelController.createLevel)
  .get('/', auth(USER_ROLE.school), LevelController.getAllLevels);

export const LevelRoutes = router;
