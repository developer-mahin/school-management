/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { classAndSubjectQuery } from '../../helper/aggregationPipline';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import GradeSystem from '../gradeSystem/gradeSystem.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import { TStudentsGrader } from '../result/result.interface';
import Result from '../result/result.model';
import Student from '../student/student.model';
import { StudentService } from '../student/student.service';
import { TeacherService } from '../teacher/teacher.service';
import { commonPipeline } from './exam.helper';
import { TExam } from './exam.interface';
import Exam from './exam.model';

const createExam = async (payload: Partial<TExam>, user: TAuthUser) => {
  const examDate = new Date(payload?.date as Date);
  examDate.setUTCHours(0, 0, 0, 0);

  const result = await Exam.create({
    ...payload,
    date: examDate,
    schoolId: user.schoolId,
  });

  const findStudent = await Student.find({
    classId: payload.classId,
  });

  await Promise.all(
    findStudent.map((student) => {
      sendNotification(user, {
        senderId: user.userId,
        role: user.role,
        receiverId: student.userId,
        message: `Exam scheduled for ${payload.date} at ${payload.startTime}`,
        type: NOTIFICATION_TYPE.EXAM,
        linkId: result._id,
      });
    }),
  );

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

  const findStudent = await Student.find({
    classId: payload.classId,
  });

  await Promise.all(
    findStudent.map((student) => {
      sendNotification(user, {
        senderId: user.userId,
        role: user.role,
        receiverId: student.userId,
        message: `Exam scheduled updated`,
        type: NOTIFICATION_TYPE.EXAM,
        linkId: result?._id,
      });
    }),
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
  payload: Partial<TExam> & { examId: string; students: TStudentsGrader[] },
  user: TAuthUser,
) => {
  const { examId, students } = payload;

  // Validate required fields early
  if (!examId || !students?.length) {
    throw new Error('Exam ID and students are required');
  }

  // Execute all independent database queries in parallel
  const [findTeacher, findExistingResult, findExam] = await Promise.all([
    TeacherService.findTeacher(user),
    Result.findOne({ examId }).lean(),
    Exam.findOne({ _id: examId })
      .populate('classId')
      .lean() as any
  ]);

  // Early validation checks
  if (!findTeacher) {
    throw new Error('Teacher not found');
  }

  if (findExistingResult) {
    throw new Error('Result already exists');
  }

  if (!findExam) {
    throw new Error('Exam not found');
  }

  const findSchoolGrade = await GradeSystem.find({
    schoolId: findTeacher.schoolId,
  })
    .select('grade mark gpa')
    .lean();

  if (!findSchoolGrade?.length) {
    throw new Error('Grade system not configured for this school');
  }

  // Optimize grade system parsing and create lookup map
  const gradeSystemMap = new Map();
  for (const g of findSchoolGrade) {
    const [min, max] = g.mark.split('-').map(Number);

    // Validate grade range format
    if (isNaN(min) || isNaN(max)) {
      console.warn(`Invalid grade range format: ${g.mark}`);
      continue;
    }

    gradeSystemMap.set(`${min}-${max}`, {
      grade: g.grade,
      gpa: g.gpa,
      min,
      max,
    });
  }

  // Convert to sorted array for efficient lookup
  const sortedGradeSystem = Array.from(gradeSystemMap.values()).sort(
    (a, b) => a.min - b.min,
  );

  // Assign grades to students (synchronous operation, no need for async map)
  const studentsWithGrades = students.map((student) => {
    // Use binary search or simple find for better performance
    const foundGrade = sortedGradeSystem.find(
      (g) => student.mark >= g.min && student.mark <= g.max,
    );

    return {
      ...student,
      grade: foundGrade?.grade ?? 'F',
      gpa: foundGrade?.gpa ?? 0.0,
    };
  });

  // Create result and send notification in parallel
  const resultPromise = Result.create({
    schoolId: findTeacher.schoolId,
    teacherId: user.teacherId,
    ...payload,
    students: studentsWithGrades,
  });

  const notificationPromise = sendNotification(user, {
    senderId: user.userId,
    role: user.role,
    receiverId: user.mySchoolUserId,
    message: `Grades updated for class ${findExam.classId?.className}`,
    type: NOTIFICATION_TYPE.GRADE,
    linkId: examId, // Will be updated after result creation
  });

  const updateExam = Exam.findOneAndUpdate(
    {
      _id: examId,
    },
    {
      $set: {
        isSubmitted: true,
      },
    },
    { new: true },
  );

  const [result] = await Promise.all([
    resultPromise,
    notificationPromise,
    updateExam,
  ]);

  return result;
};

const getExamSchedule = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
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
          date: { $gte: nowDate },
        },
      },

      {
        $addFields: {
          dateOnly: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date',
            },
          },
        },
      },
      ...classAndSubjectQuery,

      {
        $group: {
          _id: '$dateOnly',
          exams: { $push: '$$ROOT' },
        },
      },

      {
        $project: {
          _id: 0,
          date: '$_id',
          exams: 1,
        },
      },

      {
        $sort: {
          date: 1,
        },
      },
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
  getExamSchedule,
};
