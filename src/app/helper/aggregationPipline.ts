const userProfile = (name: string) => {
  const data = [
    {
      $lookup: {
        from: 'profiles',
        localField: `${name}.profile`,
        foreignField: '_id',
        as: 'profile',
      },
    },
    {
      $unwind: {
        path: '$profile',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
  return data;
};

export const classAndSubjectQuery = [
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
];

export const aggregationPipelineHelper = {
  userProfile,
};
