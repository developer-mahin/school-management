import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { TermsController } from './terms.controller';

const router = Router();

router
  .post('/create', auth(USER_ROLE.school), TermsController.createTerms)
  .get('/', auth(USER_ROLE.school), TermsController.getAllTerms)
  .patch('/:termsId', auth(USER_ROLE.school), TermsController.updateTerms)
  .delete('/:termsId', auth(USER_ROLE.school), TermsController.deleteTerms);

export const TermsRoutes = router;
