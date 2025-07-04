import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';
import { TAuthUser } from '../../interface/authUser';

const updateUserActions = catchAsync(async (req, res) => {
  const result = await UserService.updateUserActions(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User updated successfully',
    data: result,
  });
});

const addParentsMessage = catchAsync(async (req, res) => {
  const result = await UserService.addParentsMessage(req.body);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'message added successfully',
  });
});

const getAllCustomers = catchAsync(async (req, res) => {
  const result = await UserService.getAllCustomers(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'customers fetched successfully',
  });
});

const createAdmin = catchAsync(async (req, res) => {
  const result = await UserService.createAdmin(req.body);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'admin created successfully',
  });
});

const getAllAdmin = catchAsync(async (req, res) => {
  const result = await UserService.getAllAdmin(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'admin fetched successfully',
  });
});

const countTotal = catchAsync(async (req, res) => {
  const result = await UserService.countTotal(req.user as TAuthUser);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Total  fetched successfully',
  });
});

const userOverView = catchAsync(async (req, res) => {
  const result = await UserService.userOverView(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'user overview fetched successfully',
  });
});

const getParentsMessage = catchAsync(async (req, res) => {
  const result = await UserService.getParentsMessage(req.params.studentId);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'user overview fetched successfully',
  });
});

export interface MulterFiles {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [fieldname: string]: any[];
}

const editProfile = catchAsync(async (req, res) => {
  const fields = ['image', 'schoolImage', 'coverImage'];

  // Type req.files as MulterFiles
  const files = req.files as MulterFiles | undefined;

  if (files && !Array.isArray(files) && typeof files === 'object') {
    await Promise.all(
      fields.map(async (field) => {
        const fileArray = files[field];
        if (fileArray && fileArray.length > 0) {
          // const s3Url = await uploadFileWithS3(fileArray[0]);
          req.body[field] = fileArray[0]?.path;
          console.log(fileArray[0]?.path);
        }
      }),
    );
  }

  const result = await UserService.editProfile(req.user as TAuthUser, req.body);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'user overview fetched successfully',
  });
});

const fileUpload = catchAsync(async (req, res) => {
  if (req.file) {
    req.body.file = req.file.path;
  }
  const result = req.body;
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'user overview fetched successfully',
  });
});

export const UserController = {
  updateUserActions,
  createAdmin,
  getAllCustomers,
  getAllAdmin,
  countTotal,
  userOverView,
  addParentsMessage,
  getParentsMessage,
  editProfile,
  fileUpload,
};
