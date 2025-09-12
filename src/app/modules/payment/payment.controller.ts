import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.service';

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
  const userAgent = req.headers['user-agent'];
  if (!userAgent) {
    throw new Error('User agent not found');
  }

  const result = await PaymentService.confirmPayment(req.query);

  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);

  const deviceType = isMobile ? 'Mobile' : 'PC';
  // if (deviceType !== 'Mobile') {
  res.redirect(`http://classaty.com/payment-success?amount=${req.query.amount}`);
  // res.redirect(`http://10.10.10.30:8010/api/v1/payment/confirm-payment?subscriptionId=${req.query.subscriptionId}&userId=${req.query.userId}&amount=${req.query.amount}&paymentId=${req.query.paymentId}`);
  // }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Payment created successfully',
    data: result,
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

const cancelPayment = catchAsync(async (req, res) => {

  const userAgent = req.headers['user-agent'];
  if (!userAgent) {
    throw new Error('User agent not found');
  }

  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);

  const deviceType = isMobile ? 'Mobile' : 'PC';
  // if (deviceType !== 'Mobile') {
  res.redirect(`http://classaty.com/cancel-payment?amount=${req.query.amount}`);
  // }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.BAD_GATEWAY,
    message: 'Payment Canceled',
  });
});

export const PaymentController = {
  makePayment,
  paymentList,
  confirmPayment,
  earningStatistic,
  cancelPayment
};
