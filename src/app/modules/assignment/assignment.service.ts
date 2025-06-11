import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Teacher from '../teacher/teacher.model';
import { TAssignment } from './assignment.interface';
import Assignment from './assignment.model';

const createAssignment = async (
  user: TAuthUser,
  payload: Partial<TAssignment>,
) => {
  const findTeacher = await Teacher.findById(user.teacherId);
  if (!findTeacher)
    throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');

  const createAssignment = await Assignment.create({
    ...payload,
    schoolId: findTeacher.schoolId,
  });

  return createAssignment;
};

export const AssignmentService = {
  createAssignment,
};
