// const result = await Exam.aggregate([
// // Step 1: Match Exams for the school
// {
// $match: {
// schoolId: new mongoose.Types.ObjectId(String(user.schoolId)),
// },
// },

// // Step 2: Join with results by examId
// {
// $lookup: {
  //       from: 'results',
  //       localField: '_id',
  //       foreignField: 'examId',
  //       as: 'results',
  //     },
  //   },
  //   { $unwind: '$results' },

// // Step 3: Unwind students array
// { $unwind: '$results.students' },

// // Step 4: Lookup student details
// {
// $lookup: {
  //       from: 'students',
  //       localField: 'results.students.studentId',
  //       foreignField: '_id',
  //       as: 'studentInfo',
  //     },
  //   },
  //   { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },

// // Step 5: Lookup user (to get name)
// {
// $lookup: {
  //       from: 'users',
  //       localField: 'studentInfo.userId',
  //       foreignField: '_id',
  //       as: 'userInfo',
  //     },
  //   },
  //   { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },

// // Step 6: Group per term + student
// {
// $group: {
  //       _id: {
  //         termId: '$termsId',
// studentId: '$results.students.studentId',
  //       },
  //       averageGPA: { $avg: '$results.students.gpa' },
// totalSubjects: { $sum: 1 },
  //       studentId: { $first: '$results.students.studentId' },
// className: { $first: '$studentInfo.className' },
// section: { $first: '$studentInfo.section' },
// name: { $first: '$userInfo.name' },
// },
// },

// // Step 7: Re-group by termId to collect all students under one term
// {
// $group: {
  //       _id: '$\_id.termId',
// students: {
// $push: {
  //           studentId: '$studentId',
// className: '$className',
  //           section: '$section',
// name: '$name',
  //           averageGPA: '$averageGPA',
// },
// },
// },
// },

// // Step 8: Join with term info
// {
// $lookup: {
  //       from: 'terms',
  //       localField: '_id',
  //       foreignField: '_id',
  //       as: 'term',
  //     },
  //   },
  //   { $unwind: { path: '$term', preserveNullAndEmptyArrays: true } },

// // Step 9: Final structure
// {
// $project: {
  //       _id: 0,
  //       termId: '$\_id',
// term: 1,
// students: 1,
// },
// },
// ]);
