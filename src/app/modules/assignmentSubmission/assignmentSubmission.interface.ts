import { ObjectId } from 'mongoose';

export type TAssignmentSubmission = {
  assignmentId: ObjectId;
  studentId: ObjectId;
  userId: ObjectId;
  submittedFile: string;
  grade: number;
  // status: "pending" | "submitted" ;
};
