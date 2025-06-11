import { TAuthUser } from '../../interface/authUser';
import { TAttendance } from './attendance.interface';

const createAttendance = async (
  payload: Partial<TAttendance>,
  user: TAuthUser,
) => {
  return user;
};

export const AttendanceService = {
  createAttendance,
};
