import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

const studentSchema = z.object({
  body: z.object({
    schoolId: z.string().regex(objectIdRegex, 'Invalid ObjectId').optional(),
    classId: z.string().regex(objectIdRegex, 'Invalid ObjectId'),
    section: z.string().min(1, 'Section is required'),
    schoolName: z.string().min(1, 'School name is required').optional(),
    className: z.string().min(1, 'Class name is required'),
    fatherPhoneNumber: z.string().min(1, 'Father phone number is required'),
    motherPhoneNumber: z.string().min(1, 'Mother phone number is required'),
    phoneNumber: z.string().min(1, 'Phone number is required').optional(),
  }),
});

export const StudentValidation = {
  studentSchema,
};
