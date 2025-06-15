import { z } from 'zod';

// Main Attendance schema
const attendanceSchema = z.object({
  body: z.object({
    classScheduleId: z.string(),
    section: z.string(),
    className: z.string(),
    presentStudents: z.array(z.string()),
    absentStudents: z.array(z.string()),
  }),
});

export const AttendanceValidation = {
  attendanceSchema,
};
