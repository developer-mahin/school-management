import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { GradeSystemService } from './gradeSystem.service';

const createGradeSystem = catchAsync(async (req, res) => {
  const result = await GradeSystemService.createGradeSystem(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Grade System created successfully',
    data: result,
  });
});

const getAllGradeSystem = catchAsync(async (req, res) => {
  const result = await GradeSystemService.getAllGradeSystem(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Grade System fetched successfully',
    data: result,
  });
});

const updateGradeSystem = catchAsync(async (req, res) => {
  const result = await GradeSystemService.updateGradeSystem(
    req.params.gradeSystemId,
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Grade System updated successfully',
    data: result,
  });
});

const deleteGradeSystem = catchAsync(async (req, res) => {
  const result = await GradeSystemService.deleteGradeSystem(
    req.params.gradeSystemId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Grade System deleted successfully',
    data: result,
  });
});

export const GradeSystemController = {
  createGradeSystem,
  getAllGradeSystem,
  updateGradeSystem,
  deleteGradeSystem,
};
