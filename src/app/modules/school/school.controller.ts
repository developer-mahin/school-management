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
  const result = await SchoolService.getSchoolList(req.query );
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

const editSchool = catchAsync(async (req, res) => {
  const result = await SchoolService.editSchool(req.params.schoolId, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'School updated successfully',
    data: result,
  });
});

const deleteSchool = catchAsync(async (req, res) => {
  const result = await SchoolService.deleteSchool(req.params.schoolId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'School deleted successfully',
    data: result,
  });
})

export const SchoolController = {
  createSchool,
  getSchoolList,
  getTeachers,
  editSchool,
  deleteSchool
};
