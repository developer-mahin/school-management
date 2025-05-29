import { z } from "zod";

const phoneNumberRegex = /^\+\d{1,4}\d{6,14}$/;


const createSchoolValidation = z.object({
    body: z.object({
        schoolName: z.string({ required_error: 'Name is required' }),
        phoneNumber: z
            .string({ required_error: 'Phone number is required' })
            .regex(phoneNumberRegex, { message: 'Phone number must include country code starting with + and digits only' }),
        schoolAddress: z.string({ required_error: 'Profile image is required' }),
        adminName: z.string({ required_error: 'Admin Name is required' }),
    }),
});

export const SchoolValidation = {
    createSchoolValidation
};
