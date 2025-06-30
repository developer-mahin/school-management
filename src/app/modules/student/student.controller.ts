import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StudentService } from './student.service';

const createStudent = catchAsync(async (req, res) => {
  const result = await StudentService.createStudent(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Student created successfully',
    data: result,
  });
});

const getAllStudents = catchAsync(async (req, res) => {
  const result = await StudentService.getAllStudents(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Students fetched successfully',
    data: result,
  });
});

const getMyChildren = catchAsync(async (req, res) => {
  const result = await StudentService.getMyChildren(req.user as TAuthUser);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Students fetched successfully',
    data: result,
  });
});
const selectChild = catchAsync(async (req, res) => {
  const result = await StudentService.selectChild(req.params.userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Students fetched successfully',
    data: result,
  });
});

const editStudent = catchAsync(async (req, res) => {
  const result = await StudentService.editStudent(
    req.params.studentId,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Students fetched successfully',
    data: result,
  });
});

const deleteStudent = catchAsync(async (req, res) => {
  const result = await StudentService.deleteStudent(req.params.studentId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Students fetched successfully',
    data: result,
  });
});

const getParentsList = catchAsync(async (req, res) => {
  const result = await StudentService.getParentsList(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Students fetched successfully',
    data: result,
  });
});

const getParentsDetails = catchAsync(async (req, res) => {
  const result = await StudentService.getParentsDetails(
    req.params.parentUserId,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Students fetched successfully',
    data: result,
  });
});

export const StudentController = {
  createStudent,
  getMyChildren,
  selectChild,
  getAllStudents,
  editStudent,
  deleteStudent,
  getParentsList,
  getParentsDetails,
};
