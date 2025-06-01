import { TAuthUser } from '../../interface/authUser';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { TExam } from './exam.interface';
import Exam from './exam.model';

const createExam = async (payload: Partial<TExam>, user: TAuthUser) => {
  const result = await Exam.create({ ...payload, schoolId: user.schoolId });
  return result;
};

const getTermsExams = async (
  termsId: string,
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const examQuery = new QueryBuilder(
    Exam.find({ schoolId: user.schoolId, termsId: termsId }),
    query,
  )
    .paginate()
    .sort();

  const result = await examQuery.queryModel;

  const meta = await examQuery.countTotal();
  return { meta, result };
};

const updateExams = async (
  id: string,
  payload: Partial<TExam>,
  user: TAuthUser,
) => {
  const result = await Exam.findOneAndUpdate(
    { _id: id, schoolId: user.schoolId },
    payload,
    { new: true },
  );
  return result;
};

const deleteExams = async (id: string, user: TAuthUser) => {
  const result = await Exam.findOneAndDelete({
    _id: id,
    schoolId: user.schoolId,
  });
  return result;
};

export const ExamService = {
  createExam,
  getTermsExams,
  updateExams,
  deleteExams,
};
