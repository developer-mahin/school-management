import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ExamService } from './exam.service';
import { TAuthUser } from '../../interface/authUser';

const createExam = catchAsync(async (req, res) => {
  const result = await ExamService.createExam(req.body, req.user as TAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Exam created successfully',
    data: result,
  });
});

const getTermsExams = catchAsync(async (req, res) => {
  const result = await ExamService.getTermsExams(
    req.params.termsId,
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exams fetched successfully',
    data: result,
  });
});

const updateExams = catchAsync(async (req, res) => {
  const result = await ExamService.updateExams(
    req.params.examId,
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exam updated successfully',
    data: result,
  });
});

const deleteExams = catchAsync(async (req, res) => {
  const result = await ExamService.deleteExams(
    req.params.examId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exam deleted successfully',
    data: result,
  });
});

const getExamsOfTeacher = catchAsync(async (req, res) => {
  const result = await ExamService.getExamsOfTeacher(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exams fetched successfully',
    data: result,
  });
});

const updateGrade = catchAsync(async (req, res) => {
  const result = await ExamService.updateGrade(req.body, req.user as TAuthUser);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Grade updated successfully',
    data: result,
  });
});

const getExamSchedule = catchAsync(async (req, res) => {
  const result = await ExamService.getExamSchedule(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exams fetched successfully',
    data: result,
  });
});

const getGradesResult = catchAsync(async (req, res) => {
  const result = await ExamService.getGradesResult(
    req.user as TAuthUser,
    req.params.examId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Exams fetched successfully',
    data: result,
  });
});

const updateResult = catchAsync(async (req, res) => {
  const result = await ExamService.updateResult(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Result updated successfully',
    data: result,
  });
});

export const ExamController = {
  createExam,
  getTermsExams,
  updateExams,
  deleteExams,
  getExamsOfTeacher,
  updateGrade,
  getExamSchedule,
  getGradesResult,
  updateResult,
};
