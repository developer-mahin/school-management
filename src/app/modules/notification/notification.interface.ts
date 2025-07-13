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
  | 'custom'
  | 'manager'
  | 'announcement';

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
  CUSTOM: 'custom',
  MANAGER: 'manager',
  ANNOUNCEMENT: 'announcement',
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
