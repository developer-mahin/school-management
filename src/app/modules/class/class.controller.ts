import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ClassService } from './class.service';
import { TAuthUser } from '../../interface/authUser';

const createClass = catchAsync(async (req, res) => {
  const result = await ClassService.createClass(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Class created successfully',
    data: result,
  });
});

const getAllClasses = catchAsync(async (req, res) => {
  const result = await ClassService.getAllClasses(
    req.user as TAuthUser,
    req.params.levelId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Classes fetched successfully',
    data: result,
  });
});

const updateClass = catchAsync(async (req, res) => {
  const result = await ClassService.updateClass(req.params.classId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class updated successfully',
    data: result,
  });
});

const deleteClass = catchAsync(async (req, res) => {
  const result = await ClassService.deleteClass(req.params.classId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Class deleted successfully',
    data: result,
  });
});

const getClassBySchoolId = catchAsync(async (req, res) => {
  const result = await ClassService.getClassBySchoolId(req.params.schoolId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Classes fetched successfully',
    data: result,
  });
});

const getSectionsByClassId = catchAsync(async (req, res) => {
  const result = await ClassService.getSectionsByClassId(req.params.classId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sections fetched successfully',
    data: result,
  });
});

export const ClassController = {
  createClass,
  getAllClasses,
  updateClass,
  deleteClass,
  getClassBySchoolId,
  getSectionsByClassId,
};
