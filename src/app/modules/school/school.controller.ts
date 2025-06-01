import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SchoolService } from './school.service';
import { TAuthUser } from '../../interface/authUser';

const createSchool = catchAsync(async (req, res) => {
  const result = await SchoolService.createSchool(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'School created successfully',
    data: result,
  });
});

const getSchoolList = catchAsync(async (req, res) => {
  const result = await SchoolService.getSchoolList();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Schools fetched successfully',
    data: result,
  });
});

const getTeachers = catchAsync(async (req, res) => {
  const result = await SchoolService.getTeachers(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Teachers fetched successfully',
    data: result,
  });
});

export const SchoolController = {
  createSchool,
  getSchoolList,
  getTeachers,
};
