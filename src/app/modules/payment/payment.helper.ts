/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';

// Centralized subscription configs
const subscriptionConfig: Record<string, any> = {
  plus: {
    canChat: true,
    canSeeExam: true,
    canSeeAssignment: true,
    isAttendanceEnabled: true,
    isExamGradeEnabled: true,
    unlockedStudents: 1,
    unlockedParents: 0,
  },
  silver: {
    canChat: true,
    canSeeExam: true,
    canSeeAssignment: true,
    isAttendanceEnabled: true,
    isExamGradeEnabled: true,
    unlockedStudents: 10000,
    unlockedParents: 1,
  },
  gold: {
    canChat: true,
    canSeeExam: true,
    canSeeAssignment: true,
    isAttendanceEnabled: true,
    isExamGradeEnabled: true,
    unlockedStudents: 10000,
    unlockedParents: 2,
  },
};

// Utility to get subscription data
export const getSubscriptionData = (planName: string) => {
  return subscriptionConfig[planName?.toLowerCase()] || {};
};

// Helper function to create payment body
const createPaymentBody = ({
  userId,
  amount,
  paymentIntentId,
  subscriptionId,
}: any) => {
  return {
    userId,
    subscriptionId,
    amount,
    paymentId:
      paymentIntentId || `pi_${crypto.randomBytes(16).toString('hex')}`,
    paymentDate: new Date(),
  };
};

// Helper function to create subscription body
const createMySubscriptionBody = ({
  userId,
  subscription,
  subscriptionId,
  timeline,
  amount,
}: any) => {
  const mySubscriptionData = getSubscriptionData(subscription?.planName);

  return {
    userId,
    subscriptionId,
    expiryIn: new Date(
      Date.now() + subscription.timeline * 24 * 60 * 60 * 1000,
    ),
    timeline,
    amount,
    remainingParents: subscription.numberOfParents,
    remainingChildren: subscription.numberOfChildren,
    ...mySubscriptionData,
  };
};

export const PaymentHelper = {
  createPaymentBody,
  createMySubscriptionBody,
};
