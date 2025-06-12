import { TAuthUser } from '../../interface/authUser';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { TSubject } from './subject.interface';
import Subject from './subject.model';

const createSubject = async (payload: Partial<TSubject>, user: TAuthUser) => {
  const result = await Subject.create({ ...payload, schoolId: user.schoolId });
  return result;
};

const getSubject = async (user: TAuthUser, query: Record<string, unknown>) => {
  const subjectQuery = new QueryBuilder(
    Subject.find({
      schoolId: user.schoolId,
    }),
    query,
  );
  const result = await subjectQuery.sort().paginate().search(['subjectName'])
    .queryModel;

  const meta = await subjectQuery.countTotal();
  return { meta, result };
};

const updateSubject = async (
  payload: Partial<TSubject> & { subjectId: string },
  user: TAuthUser,
) => {
  const result = await Subject.findOneAndUpdate(
    { _id: payload.subjectId, schoolId: user.schoolId },
    payload,
    { new: true },
  );
  return result;
};

const deleteSubject = async (id: string, user: TAuthUser) => {
  const result = await Subject.findOneAndDelete({
    _id: id,
    schoolId: user.schoolId,
  });
  return result;
};

export const SubjectService = {
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject,
};
