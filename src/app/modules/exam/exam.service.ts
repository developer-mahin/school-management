/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload, Secret } from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../../../config';
import sendNotification from '../../../socket/sendNotification';
import { USER_ROLE } from '../../constant';
import { classAndSubjectQuery } from '../../helper/aggregationPipline';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import { decodeToken } from '../../utils/decodeToken';
import { getSchoolIdFromUser } from '../../utils/getSchoolIdForManager';
import GradeSystem from '../gradeSystem/gradeSystem.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import { TResultUpdate, TStudentsGrader } from '../result/result.interface';
import Result from '../result/result.model';
import Student from '../student/student.model';
import { promoteStudentToNextClass } from '../student/student.promotion.helper';
import { StudentService } from '../student/student.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { TeacherService } from '../teacher/teacher.service';
import { commonPipeline } from './exam.helper';
import { TExam } from './exam.interface';
import Exam from './exam.model';

const createExam = async (payload: Partial<TExam>, user: TAuthUser) => {
  const examDate = new Date(payload?.date as Date);
  examDate.setUTCHours(0, 0, 0, 0);

  const schoolId = getSchoolIdFromUser(user);

  const result = await Exam.create({
    ...payload,
    date: examDate,
    schoolId,
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

  const schoolId = getSchoolIdFromUser(user);

  const result = await examQuery
    .customPipeline([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(schoolId)),
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
    Exam.findOne({ _id: examId }).populate('classId').lean() as any,
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

  // 🎓 Auto-promote students who passed all subjects in final term
  try {
    const promotionPromises = studentsWithGrades.map(async (student) => {
      const promotionResult = await promoteStudentToNextClass(
        student.studentId.toString(),
        payload.termsId,
        user,
      );

      if (promotionResult.promoted) {
        console.log(
          `✅ Student ${student.studentId} promoted: ${promotionResult.oldClassName} → ${promotionResult.newClassName}`,
        );
      } else {
        console.log(
          `ℹ️ Student ${student.studentId} not promoted: ${promotionResult.message}`,
        );
      }

      return promotionResult;
    });

    // Execute all promotions in parallel
    await Promise.all(promotionPromises);
  } catch (error) {
    console.error('Error during student promotion:', error);
    // Don't throw error - promotion failure shouldn't break grade submission
  }

  return result;
};

const getExamSchedule = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const examQuery = new AggregationQueryBuilder(query);

  const { token } = query;

  let decodedUser;

  if (token) {
    decodedUser = decodeToken(
      token as string,
      config.jwt.access_token as Secret,
    ) as JwtPayload;
  }

  if (decodedUser?.role === USER_ROLE.parents) {
    const subscription = await SubscriptionService.getMySubscription(
      decodedUser as TAuthUser,
    );

    if (
      Object.keys(subscription || {}).length === 0 ||
      subscription.canSeeExam === false
    ) {
      throw new AppError(
        700,
        'You need an active subscription to get exam schedule',
      );
    }
  }

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
    .paginate()
    .execute(Exam);
  const meta = await examQuery.countTotal(Exam);
  return { meta, result };
};

const getGradesResult = async (user: TAuthUser, examId: string) => {
  const result = await Result.aggregate([
    {
      $match: {
        examId: new mongoose.Types.ObjectId(String(examId)),
      },
    },
    {
      $unwind: {
        path: '$students',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'students',
        localField: 'students.studentId',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
        foreignField: '_id',
        as: 'student',
      },
    },
    {
      $unwind: {
        path: '$student',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        createdAt: 1,
        studentId: '$student._id',
        studentName: '$student.user.name',
        parentsMessage: '$student.parentsMessage',
        mark: '$students.mark',
      },
    },
  ]);

  return result;
};

const updateResult = async (payload: TResultUpdate, user: TAuthUser) => {
  console.log(payload, '======> payload in update result service');
  // Fetch result and grade system concurrently
  const [findResult, findSchoolGrade] = await Promise.all([
    Exam.aggregate([
      {
        $match: {
          termsId: new mongoose.Types.ObjectId(String(payload.termsId)),
        },
      },
      {
        $lookup: {
          from: 'results',
          localField: '_id',
          foreignField: 'examId',
          as: 'results',
        },
      },
      {
        $unwind: '$results',
      },
      {
        $unwind: '$results.students',
      },
      {
        $match: {
          'results.students._id': new mongoose.Types.ObjectId(payload.resultId),
        },
      },
      {
        $project: { results: 1 },
      },
    ]),
    GradeSystem.find({ schoolId: user.schoolId })
      .select('grade mark gpa')
      .lean(),
  ]);

  console.log(findResult, '======> findResult in update result service');

  // return
  if (!findSchoolGrade.length) {
    throw new Error('Grade system not configured for this school');
  }

  // Prepare the grade map (only once)
  const sortedGradeSystem = findSchoolGrade
    .map(({ grade, mark, gpa }) => {
      const [min, max] = mark.split('-').map(Number);
      return { grade, gpa, min, max };
    })
    .filter(({ min, max }) => !isNaN(min) && !isNaN(max))
    .sort((a, b) => a.min - b.min);

  // Find the matching grade based on the provided mark
  const foundGrade = sortedGradeSystem.find(
    ({ min, max }) => payload.mark >= min && payload.mark <= max,
  );
  const gradeCalculation = {
    grade: foundGrade?.grade ?? 'F',
    gpa: foundGrade?.gpa ?? 0.0,
  };

  console.log(findResult[0]?.results?._id, 'findResult[0]?.results?._id');

  // Update the result with the new grade and GPA
  const updatedResult = await Result.findOneAndUpdate(
    {
      _id: findResult[0]?.results?._id,
      'students._id': payload.resultId,
    },
    {
      $set: {
        'students.$.mark': payload.mark,
        'students.$.grade': gradeCalculation.grade,
        'students.$.gpa': gradeCalculation.gpa,
      },
    },
    { new: true },
  );

  return updatedResult;
};

export const ExamService = {
  createExam,
  getTermsExams,
  updateExams,
  deleteExams,
  getExamsOfTeacher,
  updateGrade,
  getExamSchedule,
  getGradesResult,
  updateResult,
};
