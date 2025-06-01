import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

const teacherSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name is required'),
    schoolId: z.string().regex(objectIdRegex, 'Invalid ObjectId').optional(),
    schoolName: z
      .string({ required_error: 'School name is required' })
      .min(1, 'School name is required')
      .optional(),
    subjectName: z.string().min(1, 'Section is required'),
    phoneNumber: z.string().min(1, 'Phone number is required').optional(),
  }),
});

export const TeacherValidation = {
  teacherSchema,
};
