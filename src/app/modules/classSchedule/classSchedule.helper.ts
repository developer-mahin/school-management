export const commonPipeline = [
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
];
