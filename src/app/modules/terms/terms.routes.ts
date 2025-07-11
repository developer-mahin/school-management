import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { TermsController } from './terms.controller';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.school, USER_ROLE.manager),
    TermsController.createTerms,
  )
  .get(
    '/',
    auth(USER_ROLE.school, USER_ROLE.manager, USER_ROLE.student),
    TermsController.getAllTerms,
  )
  .get(
    '/result/get_result_based_on_terms/:termsId',
    auth(USER_ROLE.student, USER_ROLE.school, USER_ROLE.manager),
    TermsController.getResultBasedOnTerms,
  )
  .patch('/:termsId', auth(USER_ROLE.school), TermsController.updateTerms)
  .delete('/:termsId', auth(USER_ROLE.school), TermsController.deleteTerms);

export const TermsRoutes = router;
