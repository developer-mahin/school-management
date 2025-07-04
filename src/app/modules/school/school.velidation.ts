import { z } from 'zod';

const createSchoolValidation = z.object({
  body: z.object({
    schoolName: z.string({ required_error: 'Name is required' }),
    phoneNumber: z.string({ required_error: 'Phone number is required' }),
    schoolAddress: z.string({ required_error: 'Profile image is required' }),
    adminName: z.string({ required_error: 'Admin Name is required' }),
  }),
});

export const SchoolValidation = {
  createSchoolValidation,
};
