import { classAndSubjectQuery } from '../../helper/aggregationPipline';

export const commonPipeline = [
  ...classAndSubjectQuery,
  {
    $lookup: {
      from: 'users',
      localField: 'teacherId',
      foreignField: 'teacherId',
      as: 'teacher',
    },
  },
  {
    $unwind: {
      path: '$teacher',
      preserveNullAndEmptyArrays: true,
    },
  },

  {
    $project: {
      teacherName: '$teacher.name',
      subjectName: '$subject.subjectName',
      subjectId: '$subject._id',
      className: '$class.className',
      classId: '$class._id',
      teacherId: '$teacher.teacherId',
      details: 1,
      passGrade: 1,
      date: 1,
      startTime: 1,
      classRoom: 1,
      duration: 1,
      isSubmitted: 1,
      instruction: 1,
      totalMarks: 1,
    },
  },
];
