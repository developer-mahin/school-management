export const commonPipeline = [
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
    $lookup: {
      from: 'classes',
      localField: 'classId',
      foreignField: '_id',
      as: 'class',
    },
  },
  {
    $unwind: {
      path: '$class',
      preserveNullAndEmptyArrays: true,
    },
  },
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
      className: '$class.className',
      details: 1,
      passGrade: 1,
      date: 1,
      startTime: 1,
      classRoom: 1,
      duration: 1,
      isSubmitted: 1,
      instruction: 1,
    },
  },
];
