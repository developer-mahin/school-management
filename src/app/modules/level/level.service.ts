import { TAuthUser } from '../../interface/authUser';
import { TLevel } from './level.interface';
import Level from './level.model';

const createLevel = async (payload: TLevel, user: TAuthUser) => {
  const result = await Level.create({
    ...payload,
    schoolId: user.schoolId,
  });
  return result;
};

const getAllLevels = async (user: TAuthUser) => {
  const result = await Level.find({ schoolId: user.schoolId });
  return result;
};

export const LevelService = {
  createLevel,
  getAllLevels,
};
