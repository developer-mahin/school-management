import { TAuthUser } from '../../interface/authUser';
import Level from '../level/level.model';
import { TClass } from './class.interface';
import Class from './class.model';

const createClass = async (payload: Partial<TClass>, user: TAuthUser) => {
  const findLevel = await Level.findById(payload.levelId);
  if (!findLevel) throw new Error('Level not found');

  const section = payload?.section?.map((item) => item).join(' / ');

  const result = await Class.create({
    ...payload,
    schoolId: user.schoolId,
    levelName: findLevel.levelName,
    section,
  });
  return result;
};

const getAllClasses = async (user: TAuthUser, id: string) => {
  const result = await Class.find({ schoolId: user.schoolId, levelId: id });
  return result;
};

export const ClassService = {
  createClass,
  getAllClasses,
};
