import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import GradeSystem from '../gradeSystem/gradeSystem.model';
import { TStudentsGrader } from '../result/result.interface';
import Result from '../result/result.model';
import { StudentService } from '../student/student.service';
import { TeacherService } from '../teacher/teacher.service';
import { commonPipeline } from './exam.helper';
import { TExam } from './exam.interface';
import Exam from './exam.model';
import { classAndSubjectQuery } from '../../helper/aggregationPipline';

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
  payload: Partial<TExam> & { examId: string, students: TStudentsGrader[] },
  user: TAuthUser,
) => {
  const findTeacher = await TeacherService.findTeacher(user);
  const findSchoolGrade = await GradeSystem.find({
    schoolId: findTeacher.schoolId,
  }).select('grade mark gpa');


  const findExistingResult = await Result.findOne({
    examId: payload?.examId,
  });

  if (findExistingResult) {
    throw new Error('Result already exists');
  }

  const students = payload.students;
  const gradeSystem = findSchoolGrade;

  // Step 1: Convert grade ranges to numbers
  const parsedGradeSystem = gradeSystem.map((g) => {
    const [min, max] = g.mark.split('-').map(Number);

    return {
      grade: g.grade,
      gpa: g.gpa,
      min,
      max,
    };
  });

  // Step 2: Assign grade to each student
  const studentsWithGrades = students.map((student) => {
    const foundGrade = parsedGradeSystem.find((g) => {
      return student.mark >= g.min && student.mark <= g.max;
    });

    return {
      ...student,
      grade: foundGrade ? foundGrade.grade : 'F',
      gpa: foundGrade ? foundGrade.gpa : 0.0,
    };
  });

  const result = await Result.create({
    schoolId: findTeacher.schoolId,
    teacherId: user.teacherId,
    ...payload,
    students: studentsWithGrades,
  });

  return result;
};

const getExamSchedule = async (user: TAuthUser, query: Record<string, unknown>) => {
  const examQuery = new AggregationQueryBuilder(query);

  const findStudent = await StudentService.findStudent(user.studentId);
  const nowDate = new Date();
  nowDate.setUTCHours(0, 0, 0, 0);

  const result = await examQuery
    .customPipeline([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(findStudent.schoolId)),
          classId: new mongoose.Types.ObjectId(String(findStudent.classId)),
          date: { $gte: nowDate }
        },
      },

      {
        $addFields: {
          dateOnly: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date',
            },
          }
        }
      },
      ...classAndSubjectQuery,

      {
        $group: {
          _id: "$dateOnly",
          exams: { $push: "$$ROOT" },
        }
      },

      {
        $project: {
          _id: 0,
          date: "$_id",
          exams: 1
        }
      },

      {
        $sort: {
          date: 1
        }
      }
    ])
    // .sort()
    .paginate()
    .execute(Exam);
  const meta = await examQuery.countTotal(Exam);
  return { meta, result };
};

export const ExamService = {
  createExam,
  getTermsExams,
  updateExams,
  deleteExams,
  getExamsOfTeacher,
  updateGrade,
  getExamSchedule
};
