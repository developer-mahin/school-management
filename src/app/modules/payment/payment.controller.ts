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
  if (deviceType !== 'Mobile') {
    res.redirect(`https://ootms.com/payment-success?amount`);
  }
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


export const PaymentController = {
  makePayment,
  paymentList,
  confirmPayment,
  earningStatistic
};
