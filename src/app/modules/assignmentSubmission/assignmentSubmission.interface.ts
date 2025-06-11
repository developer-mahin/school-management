import { ObjectId } from 'mongoose';

export type TAssignmentSubmission = {
  assignmentId: ObjectId;
  studentId: ObjectId;
};
