import { z } from 'zod';
import { Types } from 'mongoose';

// Custom validator for Mongoose ObjectId
const objectIdSchema = z.any().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

// AttendanceStudent schema
export const attendanceStudentSchema = z.object({
  studentId: objectIdSchema,
});

// Main Attendance schema
const attendanceSchema = z.object({
  classId: objectIdSchema,
  schoolId: objectIdSchema,
  className: z.string(),
  section: z.string(),
  presentStudents: z.array(attendanceStudentSchema),
  absentStudents: z.array(attendanceStudentSchema),
  date: z.coerce.date(), // Accepts string or Date object
});

export const AttendanceValidation = {
  attendanceSchema,
};
