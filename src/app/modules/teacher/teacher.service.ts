/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import School from '../school/school.model';
import { createUserWithProfile } from '../user/user.helper';
import { TTeacher } from './teacher.interface';
import Teacher from './teacher.model';

const createTeacher = async (
  payload: Partial<TTeacher> & { phoneNumber: string; name?: string },
  user: TAuthUser,
) => {
  if (user.role === USER_ROLE.school) {
    const findSchool = await School.findById(user.schoolId);
    if (!findSchool)
      throw new AppError(httpStatus.NOT_FOUND, 'School not found');
    payload.schoolName = findSchool?.schoolName;
    payload.schoolId = findSchool._id as any;
  }

  const teacher = await createUserWithProfile({
    phoneNumber: payload.phoneNumber,
    role: USER_ROLE.teacher,
    data: payload,
  });

  return teacher;
};

const findTeacher = async (user: TAuthUser) => {
  const findTeacher = await Teacher.findById(user.teacherId);
  if (!findTeacher)
    throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');
  return findTeacher;
};

export const TeacherService = {
  createTeacher,
  findTeacher,
};
