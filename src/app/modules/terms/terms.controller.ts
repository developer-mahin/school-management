import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TermsService } from './terms.service';
import { TAuthUser } from '../../interface/authUser';

const createTerms = catchAsync(async (req, res) => {
  const result = await TermsService.createTerms(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Terms created successfully',
    data: result,
  });
});

const getAllTerms = catchAsync(async (req, res) => {
  const result = await TermsService.getAllTerms(req.user as TAuthUser);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Terms fetched successfully',
    data: result,
  });
});

const updateTerms = catchAsync(async (req, res) => {
  const result = await TermsService.updateTerms(
    req.params.termsId,
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Terms updated successfully',
    data: result,
  });
});

const deleteTerms = catchAsync(async (req, res) => {
  const result = await TermsService.deleteTerms(
    req.params.termsId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Terms deleted successfully',
    data: result,
  });
});

const getResultBasedOnTerms = catchAsync(async (req, res) => {
  const result = await TermsService.getResultBasedOnTerms(
    req.params.termsId,
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Result fetched successfully',
    data: result,
  });
});

export const TermsController = {
  createTerms,
  getAllTerms,
  updateTerms,
  deleteTerms,
  getResultBasedOnTerms,
};
