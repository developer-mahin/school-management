import { TAuthUser } from '../../interface/authUser';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { getSchoolIdFromUser } from '../../utils/getSchoolIdForManager';
import { TGraderSystem } from './gradeSystem.interface';
import GradeSystem from './gradeSystem.model';

const createGradeSystem = async (
  payload: Partial<TGraderSystem>,
  user: TAuthUser,
) => {
  let gpa = 0.0;
  if (payload.grade === 'A+') gpa = 5.0;
  if (payload.grade === 'A') gpa = 4.0;
  if (payload.grade === 'A-') gpa = 3.5;
  if (payload.grade === 'B') gpa = 3.0;
  if (payload.grade === 'C') gpa = 2.0;
  if (payload.grade === 'D') gpa = 1.0;

  const schoolId = getSchoolIdFromUser(user);

  const result = await GradeSystem.create({
    ...payload,
    schoolId,
    gpa: gpa,
  });
  return result;
};

const getAllGradeSystem = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const schoolId = getSchoolIdFromUser(user);
  const gradeSystemQuery = new QueryBuilder(
    GradeSystem.find({ schoolId }),
    query,
  );

  const result = await gradeSystemQuery
    .sort()
    .search(['grade', 'mark'])
    .paginate().queryModel;

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
