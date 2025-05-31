import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SubjectService } from './subject.service';

const createSubject = catchAsync(async (req, res) => {
  const result = await SubjectService.createSubject(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Subject created successfully',
    data: result,
  });
});

const getSubject = catchAsync(async (req, res) => {
  const result = await SubjectService.getSubject(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subjects fetched successfully',
    data: result,
  });
});

const updateSubject = catchAsync(async (req, res) => {
  const result = await SubjectService.updateSubject(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subject updated successfully',
    data: result,
  });
});

const deleteSubject = catchAsync(async (req, res) => {
  const result = await SubjectService.deleteSubject(
    req.params.subjectId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subject deleted successfully',
    data: result,
  });
});

export const SubjectController = {
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject,
};
