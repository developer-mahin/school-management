import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SchoolService } from './school.service';
import { TAuthUser } from '../../interface/authUser';
import { MulterFiles } from '../user/user.controller';

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
  const result = await SchoolService.getSchoolList(req.query);
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
});

const getAllStudents = catchAsync(async (req, res) => {
  const result = await SchoolService.getAllStudents(
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

const getResultOfStudents = catchAsync(async (req, res) => {
  const result = await SchoolService.getResultOfStudents(
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

const updateSchoolProfile = catchAsync(async (req, res) => {
  const fields = ['schoolImage', 'coverImage'];

  const files = req.files as MulterFiles | undefined;

  if (files && !Array.isArray(files) && typeof files === 'object') {
    await Promise.all(
      fields.map(async (field) => {
        const fileArray = files[field];
        if (fileArray && fileArray.length > 0) {
          // const s3Url = await uploadFileWithS3(fileArray[0]);
          req.body[field] = fileArray[0]?.path;
        }
      }),
    );
  }

  const result = await SchoolService.updateSchoolProfile(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'School profile updated successfully',
    data: result,
  });
});

const getSchoolProfile = catchAsync(async (req, res) => {
  const result = await SchoolService.getSchoolProfile(req.user as TAuthUser);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'School profile fetched successfully',
    data: result,
  });
});

export const SchoolController = {
  createSchool,
  getSchoolList,
  getTeachers,
  editSchool,
  deleteSchool,
  getAllStudents,
  getResultOfStudents,
  updateSchoolProfile,
  getSchoolProfile,
};
