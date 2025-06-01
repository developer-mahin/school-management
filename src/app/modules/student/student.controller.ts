import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StudentService } from './student.service';
import { TAuthUser } from '../../interface/authUser';

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

// const getAllStudents = catchAsync(async (req, res) => {
//     const result = await StudentService.getAllStudents(req.user as TAuthUser);
//     sendResponse(res, {
//         success: true,
//         statusCode: httpStatus.OK,
//         message: 'Students fetched successfully',
//         data: result,
//     });
// });

export const StudentController = {
  createStudent,
  // getAllStudents
};
