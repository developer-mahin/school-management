import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import validateRequest from '../../middleware/validation';
import { PaymentController } from './payment.controller';
import { PaymentValidation } from './payment.validation';

const router = Router();

router
  .post(
    '/webhook',
    auth(USER_ROLE.parents),
    validateRequest(PaymentValidation.paymentValidation),
    PaymentController.makePayment,
  )
  .get('/confirm-payment', PaymentController.confirmPayment)
  .get('/failed-payment', PaymentController.failedPayment)
  .get(
    '/earning_statistic',
    auth(USER_ROLE.supperAdmin),
    PaymentController.earningStatistic,
  )
  .get(
    '/payment_list',
    auth(USER_ROLE.supperAdmin),
    PaymentController.paymentList,
  );

export const PaymentRoutes = router;
