import { TAuthUser } from '../../interface/authUser';
import { TClassSchedule } from './classSchedule.interface';
import ClassSchedule from './classSchedule.model';

const createClassSchedule = async (
  payload: Partial<TClassSchedule>,
  user: TAuthUser,
) => {
  const result = await ClassSchedule.create({
    ...payload,
    schoolId: user.schoolId,
  });
  return result;
};

export const ClassScheduleService = {
  createClassSchedule,
};
