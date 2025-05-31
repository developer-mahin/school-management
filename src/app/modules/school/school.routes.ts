import { Router } from 'express';
import validateRequest from '../../middleware/validation';
import { SchoolController } from './school.controller';
import { SchoolValidation } from './school.velidation';

const router = Router();

router.post(
  '/create',
  validateRequest(SchoolValidation.createSchoolValidation),
  SchoolController.createSchool,
);

export const SchoolRoutes = router;
