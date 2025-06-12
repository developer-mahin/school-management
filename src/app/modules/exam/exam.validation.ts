import { z } from 'zod';

// Regex to validate a MongoDB ObjectId (24 hex characters)
const objectIdRegex = /^[a-f\d]{24}$/i;

export const ExamSchema = z.object({
  body: z.object({
    subjectName: z.string().min(1, 'subjectName is required'),
    details: z.string().min(1, 'details is required'),
    passGrade: z.number().min(0, 'passGrade cannot be negative'),
    className: z.string().min(1, 'class is required'),
    date: z.preprocess((arg) => {
      if (typeof arg == 'string' || arg instanceof Date) return new Date(arg);
    }, z.date()),
    instruction: z.string().min(1, 'instruction is required'),
    startTime: z.string().min(1, 'startTime is required'),
    classRoom: z.string().min(1, 'classRoom is required'),
    duration: z.number().min(1, 'duration must be at least 1 minute'),
    assignedTeacher: z.string().min(1, 'assignedTeacher is required'),
    teacherId: z.string().regex(objectIdRegex, 'Invalid teacherId'),
    subjectId: z.string().regex(objectIdRegex, 'Invalid subjectId'),
    classId: z.string().regex(objectIdRegex, 'Invalid classId'),
  }),
});

export const ExamValidation = {
  ExamSchema,
};
