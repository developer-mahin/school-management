import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AttendanceService } from './attendance.service';

const createAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceService.createAttendance(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Attendance created successfully',
    data: result,
  });
});

const getAttendanceHistory = catchAsync(async (req, res) => {
  const result = await AttendanceService.getAttendanceHistory(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance history fetched successfully',
    data: result,
  });
});

const getMyAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceService.getMyAttendance(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance history fetched successfully',
    data: result,
  });
});

const getMyAttendanceDetails = catchAsync(async (req, res) => {
  const result = await AttendanceService.getMyAttendanceDetails(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance history fetched successfully',
    data: result,
  });
});

const getAttendanceDetails = catchAsync(async (req, res) => {
  const result = await AttendanceService.getAttendanceDetails(
    req.params.attendanceId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance history fetched successfully',
    data: result,
  });
});

const getAttendanceCount = catchAsync(async (req, res) => {
  const result = await AttendanceService.getAttendanceCount(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Attendance count fetched successfully',
    data: result,
  });
});

export const AttendanceController = {
  createAttendance,
  getAttendanceHistory,
  getMyAttendance,
  getMyAttendanceDetails,
  getAttendanceDetails,
  getAttendanceCount,
};
