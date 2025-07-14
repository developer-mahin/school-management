/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import { USER_ROLE, USER_STATUS } from '../../constant';
import AppError from '../../utils/AppError';
import { decodeToken } from '../../utils/decodeToken';
import generateToken from '../../utils/generateToken';
import { OtpService } from '../otp/otp.service';
import { TUser } from '../user/user.interface';
import User from '../user/user.model';
import Student from '../student/student.model';
import School from '../school/school.model';
import Teacher from '../teacher/teacher.model';
import Parents from '../parents/parents.model';
import Manager from '../manager/manager.model';
import axios from 'axios';

const loginUser = async (payload: Pick<TUser, 'phoneNumber'>) => {
  const { phoneNumber } = payload;

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found!');
  }

  const isDeleted = user?.isDeleted;
  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
  }

  const checkUserStatus = user?.status;
  if (checkUserStatus === USER_STATUS.blocked) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked!');
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  const otpExpiryTime = parseInt(config.otp_expire_in as string) || 3;

  try {
    await OtpService.sendOTP(
      phoneNumber,
      otpExpiryTime,
      'phone',
      'login-verification',
      otp,
    );
  } catch (error) {
    console.log(error);
  }

  const userData = {
    userId: user?._id,
    phoneNumber: user?.phoneNumber,
    role: user?.role,
  };

  const accessToken = generateToken(
    userData,
    config.jwt.sing_in_token as Secret,
    config.jwt.sing_in_expires_in as string,
  );

  return {
    signInToken: accessToken,
  };
};

const verifyOtp = async (token: string, otp: { otp: number }) => {
  // Decode token
  const decodedUser = decodeToken(
    token,
    config.jwt.sing_in_token as Secret,
  ) as JwtPayload;

  if (!decodedUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }

  // Find user by phone number
  const user = await User.findOne({
    phoneNumber: decodedUser.phoneNumber,
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Resolve school by role
  const getSchoolByRole = async (user: any) => {
    const role = user.role;
    switch (role) {
      case USER_ROLE.student: {
        const student = await Student.findById(user.studentId);
        return await School.findById(student?.schoolId);
      }
      case USER_ROLE.teacher: {
        const teacher = await Teacher.findById(user.teacherId);
        return await School.findById(teacher?.schoolId);
      }
      case USER_ROLE.parents: {
        const parent = await Parents.findById(user.parentsId);
        return await School.findById(parent?.schoolId);
      }
      case USER_ROLE.manager: {
        const manager = await Manager.findById(user.managerId);
        return await School.findById(manager?.schoolId);
      }
      default:
        return await School.findById(user.schoolId);
    }
  };

  const school = await getSchoolByRole(user);

  const otpRecord = await OtpService.checkOtpByPhoneNumber(
    decodedUser.phoneNumber,
  );
  if (!otpRecord) {
    throw new AppError(httpStatus.NOT_FOUND, "Otp doesn't exist");
  }

  const isOtpValid = await OtpService.verifyOTP(
    otp.otp,
    otpRecord._id.toString(),
  );
  if (!isOtpValid) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Otp not matched');
  }

  // 5. Delete OTP after successful verification
  await OtpService.deleteOtpById(otpRecord._id.toString());

  // 6. Prepare payload for token generation
  const userPayload = {
    userId: user._id,
    studentId: user.studentId,
    parentsId: user.parentsId,
    schoolId: user.schoolId,
    teacherId: user.teacherId,
    managerId: user.managerId,
    phoneNumber: user.phoneNumber,
    role: user.role,
    name: user.name,
    image: user.image,
    mySchoolUserId: school?.userId,
    mySchoolId: school?._id,
  };

  // 7. Generate tokens
  const accessToken = generateToken(
    userPayload,
    config.jwt.access_token as Secret,
    config.jwt.access_expires_in as string,
  );

  const refreshToken = generateToken(
    userPayload,
    config.jwt.refresh_token as Secret,
    config.jwt.refresh_expires_in as string,
  );

  // 8. Get super admin
  const superAdmin = await User.findOne({ role: USER_ROLE.supperAdmin });

  // 9. Generate children token if role is "parents"
  let childrenToken = '';
  if (user.role === USER_ROLE.parents) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    const res = await axios.get(`${config.base_api_url}/student/my_child`, {
      headers,
    });
    const firstChild = res?.data?.data?.[0]?.children;

    if (firstChild?._id) {
      const selectChild = await axios.get(
        `${config.base_api_url}/student/select_child/${firstChild._id}`,
        { headers },
      );
      childrenToken = selectChild?.data?.data?.accessToken || '';
    }
  }

  // 10. Return response
  return {
    accessToken,
    refreshToken,
    childrenToken,
    user,
    mySchoolUserId: school?.userId,
    supperAdminUserId: superAdmin?._id,
  };
};

const resendOtp = async (token: string) => {
  const decodedUser = decodeToken(
    token,
    config.jwt.sing_in_token as Secret,
  ) as JwtPayload;

  const { phoneNumber } = decodedUser;

  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpiryTime = parseInt(config.otp_expire_in as string) || 3;

  await OtpService.sendOTP(
    phoneNumber,
    otpExpiryTime,
    'phone',
    'login-verification',
    otp,
  );
};

export const AuthService = {
  resendOtp,
  loginUser,
  verifyOtp,
};
