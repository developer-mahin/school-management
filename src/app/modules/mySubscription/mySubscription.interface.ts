import { ObjectId } from 'mongoose';

export type TMySubscription = {
  userId: ObjectId;
  subscriptionId: ObjectId;
  expiryIn: Date;
  remainingChildren: number;
  timeline: 'monthly' | 'yearly';
  amount: number;
  //
  // Permissions
  //
  isAttendanceEnabled?: boolean;
  isExamGradeEnabled?: boolean;
  canChat?: boolean;
  canSeeExam?: boolean;
  canSeeAssignment?: boolean;
  unlockedStudents?: number;
  unlockedParents?: number;
};
