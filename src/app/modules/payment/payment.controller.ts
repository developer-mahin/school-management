import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.service';
import { paymentFailedHtml } from '../../../shared/html/paymentFailed';
import { paymentSuccessHtml } from '../../../shared/html/paymentSuccess';

const makePayment = catchAsync(async (req, res) => {
  const result = await PaymentService.makePayment(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Payment created successfully',
    data: result,
  });
});

const confirmPayment = catchAsync(async (req, res) => {
  const result = await PaymentService.confirmPayment(req.query);

  res.send(paymentSuccessHtml());

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Payment created successfully',
    data: result,
  });
});

const failedPayment = catchAsync(async (req, res) => {
  res.send(paymentFailedHtml());

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.BAD_GATEWAY,
    message: 'Payment failed',
  });
});

const earningStatistic = catchAsync(async (req, res) => {
  const result = await PaymentService.earningStatistic(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'earning statistic fetched successfully',
  });
});

const paymentList = catchAsync(async (req, res) => {
  const result = await PaymentService.paymentList(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'payment list fetched successfully',
  });
});

export const PaymentController = {
  makePayment,
  paymentList,
  confirmPayment,
  earningStatistic,
  failedPayment,
};
