import { TAuthUser } from '../../interface/authUser';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { TGraderSystem } from './gradeSystem.interface';
import GradeSystem from './gradeSystem.model';

const createGradeSystem = async (
  payload: Partial<TGraderSystem>,
  user: TAuthUser,
) => {
  const result = await GradeSystem.create({
    ...payload,
    schoolId: user.schoolId,
  });
  return result;
};

const getAllGradeSystem = async (user: TAuthUser, query: Record<string, unknown>) => {
  const gradeSystemQuery = new QueryBuilder(
    GradeSystem.find({ schoolId: user.schoolId }), query
  );

  const result = await gradeSystemQuery
    .sort()
    .paginate()
    .queryModel;

  const meta = await gradeSystemQuery.countTotal();

  return { meta, result };
};

const updateGradeSystem = async (
  gradeSystemId: string,
  payload: Partial<TGraderSystem>,
  user: TAuthUser,
) => {

  const result = await GradeSystem.findOneAndUpdate(
    { _id: gradeSystemId, schoolId: user.schoolId },
    payload,
    { new: true },
  );
  return result;
};

const deleteGradeSystem = async (gradeSystemId: string, user: TAuthUser) => {
  const result = await GradeSystem.findOneAndDelete({
    _id: gradeSystemId,
    schoolId: user.schoolId,
  });
  return result;
};

export const GradeSystemService = {
  createGradeSystem,
  getAllGradeSystem,
  updateGradeSystem,
  deleteGradeSystem,
};
