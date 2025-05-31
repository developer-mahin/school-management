import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { LevelService } from './level.service';
import { TAuthUser } from '../../interface/authUser';

const createLevel = catchAsync(async (req, res) => {
  const result = await LevelService.createLevel(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Level created successfully',
    data: result,
  });
});

const getAllLevels = catchAsync(async (req, res) => {
  const result = await LevelService.getAllLevels(req.user as TAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Levels fetched successfully',
    data: result,
  });
});

export const LevelController = {
  createLevel,
  getAllLevels,
};
