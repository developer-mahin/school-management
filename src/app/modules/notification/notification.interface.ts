import { ObjectId } from 'mongoose';

type TType =
  | 'assignment'
  | 'exam'
  | 'result'
  | 'grade'
  | 'assignmentSubmission'
  | 'attendance'
  | 'payment'
  | 'student'
  | 'teacher'
  | 'parent'
  | "custom";

export const NOTIFICATION_TYPE = {
  ASSIGNMENT: 'assignment',
  EXAM: 'exam',
  RESULT: 'result',
  GRADE: 'grade',
  ASSIGNMENT_SUBMISSION: 'assignmentSubmission',
  ATTENDANCE: 'attendance',
  PAYMENT: 'payment',
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  CUSTOM: "custom",
} as const;

export type TNotification = {
  senderId: ObjectId;
  receiverId: ObjectId;
  linkId: ObjectId;
  role: string;
  type: TType;
  message: string;
  isRead?: boolean;
};
