import { USER_ROLE } from '../constant';
import { TAuthUser } from '../interface/authUser';

export const getSchoolIdFromUser = (user: TAuthUser) => {
  return user.role === USER_ROLE.manager
    ? (user.mySchoolId as string)
    : (user.schoolId as string);
};
