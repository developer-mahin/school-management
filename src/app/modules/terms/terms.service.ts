import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import Exam from '../exam/exam.model';
import { TTerms } from './terms.interface';
import Terms from './terms.model';
import { StudentService } from '../student/student.service';
import { USER_ROLE } from '../../constant';
import { getSchoolIdFromUser } from '../../utils/getSchoolIdForManager';
import { decodeToken } from '../../utils/decodeToken';
import config from '../../../config';
import { JwtPayload, Secret } from 'jsonwebtoken';
import { SubscriptionService } from '../subscription/subscription.service';
import AppError from '../../utils/AppError';
import httpStatus from 'http-status';

export const TermsService = {
  createTerms: async (payload: Partial<TTerms>, user: TAuthUser) => {
    const schoolId = getSchoolIdFromUser(user);

    const result = await Terms.create({ ...payload, schoolId });
    return result;
  },

  getAllTerms: async (user: TAuthUser) => {
    const schoolId = getSchoolIdFromUser(user);

    const result = await Terms.find({ schoolId }).lean();

    return result;
  },

  updateTerms: async (
    id: string,
    payload: Partial<TTerms>,
    user: TAuthUser,
  ) => {
    const result = await Terms.findOneAndUpdate(
      { _id: id, schoolId: user.schoolId },
      payload,
      { new: true },
    );
    return result;
  },

  deleteTerms: async (id: string, user: TAuthUser) => {
    const result = await Terms.findOneAndDelete({
      _id: id,
      schoolId: user.schoolId,
    });
    return result;
  },

  getResultBasedOnTerms: async (
    id: string,
    user: TAuthUser,
    query: Record<string, unknown>,
  ) => {
    let findStudent;
    let studentObjectId;

    const { token } = query;

    let decodedUser;

    if (token) {
      decodedUser = decodeToken(token as string, config.jwt.access_token as Secret) as JwtPayload;
    }

    if (decodedUser?.role === USER_ROLE.parents) {
      const subscription = await SubscriptionService.getMySubscription(decodedUser as TAuthUser);
      if (Object.keys(subscription || {}).length === 0 || subscription.isExamGradeEnabled === false) {
        throw new AppError(httpStatus.BAD_REQUEST, 'You need an active subscription to get exam schedule');
      }
    }


    if (user.role === USER_ROLE.student) {
      findStudent = await StudentService.findStudent(user.studentId);
      studentObjectId = new mongoose.Types.ObjectId(String(user.studentId));
    } else if (user.role === USER_ROLE.school) {
      findStudent = await StudentService.findStudent(
        query?.studentId as string,
      );
      studentObjectId = new mongoose.Types.ObjectId(String(query?.studentId));
    }

    const result = await Exam.aggregate([
      {
        $match: {
          termsId: new mongoose.Types.ObjectId(String(id)),
          schoolId: new mongoose.Types.ObjectId(String(findStudent?.schoolId)),
        },
      },
      {
        $lookup: {
          from: 'results',
          localField: '_id',
          foreignField: 'examId',
          as: 'result',
        },
      },
      {
        $unwind: {
          path: '$result',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$result.students',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'result.students.studentId': studentObjectId,
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
          foreignField: '_id',
          as: 'subject',
        },
      },
      // {
      //   $unwind: {
      //     path: '$subject',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      // {
      //   $project: {
      //     subjectName: '$subject.subjectName',
      //     mark: '$result.students.mark',
      //     grade: '$result.students.grade',
      //     gpa: '$result.students.gpa',
      //   },
      // },
    ]);

    // const totalCgpa = result.reduce((acc, curr) => acc + curr.gpa, 0);
    // const gpa = totalCgpa / result.length;

    // return { result, thisTermGpa: gpa };
    return { result };
  },
};
