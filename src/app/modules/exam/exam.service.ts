import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import { TeacherService } from '../teacher/teacher.service';
import { TExam } from './exam.interface';
import Exam from './exam.model';
import { commonPipeline } from './exam.helper';
import Result from '../result/result.model';

const createExam = async (payload: Partial<TExam>, user: TAuthUser) => {
  const examDate = payload.date?.setUTCHours(0, 0, 0, 0);
  const result = await Exam.create({
    ...payload,
    date: examDate,
    schoolId: user.schoolId,
  });
  return result;
};

const getTermsExams = async (
  termsId: string,
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const examQuery = new AggregationQueryBuilder(query);

  const result = await examQuery
    .customPipeline([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(user.schoolId)),
          termsId: new mongoose.Types.ObjectId(String(termsId)),
        },
      },
      ...commonPipeline,
    ])
    .execute(Exam);

  const meta = await examQuery.countTotal(Exam);
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

const getExamsOfTeacher = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const todaysExams = query.todaysExams === 'true';
  const upcomingExams = query.upcomingExams === 'true';
  const pastExams = query.pastExams === 'true';

  const findTeacher = await TeacherService.findTeacher(user);
  const match: Record<string, unknown> = {
    schoolId: new mongoose.Types.ObjectId(String(findTeacher.schoolId)),
    teacherId: new mongoose.Types.ObjectId(String(user.teacherId)),
  };

  if (todaysExams) {
    match.date = { $eq: today };
  } else if (upcomingExams) {
    match.date = { $gt: today };
  } else if (pastExams) {
    match.date = { $lt: today };
  }

  const examQuery = new AggregationQueryBuilder(query);
  const result = await examQuery
    .customPipeline([
      {
        $match: match,
      },
      ...commonPipeline,
    ])
    .sort()
    .paginate()
    .execute(Exam);

  const meta = await examQuery.countTotal(Exam);
  return { meta, result };
};

const updateGrade = async (
  id: string,
  payload: Partial<TExam>,
  user: TAuthUser,
) => {
  const findTeacher = await TeacherService.findTeacher(user);

  const result = await Result.create({
    examId: id,
    schoolId: findTeacher.schoolId,
    teacherId: user.teacherId,
    ...payload,
  });

  return result;
};

export const ExamService = {
  createExam,
  getTermsExams,
  updateExams,
  deleteExams,
  getExamsOfTeacher,
  updateGrade,
};
