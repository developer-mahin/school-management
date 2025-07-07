import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import Exam from '../exam/exam.model';
import { TTerms } from './terms.interface';
import Terms from './terms.model';
import { StudentService } from '../student/student.service';

export const TermsService = {
  createTerms: async (payload: Partial<TTerms>, user: TAuthUser) => {
    const result = await Terms.create({ ...payload, schoolId: user.schoolId });
    return result;
  },

  getAllTerms: async (user: TAuthUser) => {
    const result = await Terms.find({ schoolId: user.schoolId })
      .lean();

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

  getResultBasedOnTerms: async (id: string, user: TAuthUser) => {
    const findStudent = await StudentService.findStudent(user.studentId);
    const studentObjectId = new mongoose.Types.ObjectId(String(user.studentId));

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
      {
        $unwind: {
          path: '$subject',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          subjectName: '$subject.subjectName',
          mark: '$result.students.mark',
          grade: '$result.students.grade',
          gpa: '$result.students.gpa',
        },
      },
    ]);

    const totalCgpa = result.reduce((acc, curr) => acc + curr.gpa, 0);
    const gpa = totalCgpa / result.length;

    return { result, thisTermGpa: gpa };
  },
};
