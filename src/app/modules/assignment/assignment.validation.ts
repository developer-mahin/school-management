import { z } from 'zod';

const assignmentSchema = z.object({
  body: z.object({
    classId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId'),
    subjectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId'),
    section: z.string().min(1, 'Section is required'),
    title: z.string().min(1, 'Title is required'),
    dueDate: z.coerce.date({ invalid_type_error: 'Invalid due date' }),
    marks: z.number().min(0, 'Marks must be a positive number'),
  }),
});

export const AssignmentValidation = {
  assignmentSchema,
};
