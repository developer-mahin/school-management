import { z } from 'zod';

// Days enum type from your TDays
const daysEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

// ObjectId validator - MongoDB ObjectIds are 24 hex characters
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z
  .string()
  .regex(objectIdRegex, 'Invalid ObjectId format');

// Main class schedule schema
export const classScheduleSchema = z.object({
  body: z.object({
    classId: objectIdSchema,
    subjectId: objectIdSchema,
    teacherId: objectIdSchema,

    days: daysEnum,
    period: z.string().min(1, 'Period is required'),
    description: z.string().optional(),
    selectTime: z.string().min(1, 'Select time is required'),
    section: z.string().min(1, 'Section is required'),
    endTime: z.string().min(1, 'End time is required'),
    date: z
      .preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date)
          return new Date(arg);
      }, z.date())
      .optional(),
    roomNo: z.string().min(1, 'Room number is required'),
  }),
});

export const ClassScheduleValidation = {
  classScheduleSchema,
};
