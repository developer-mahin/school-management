import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { AttendanceController } from './attendance.controller';
import { AttendanceValidation } from './attendance.validation';
import validateRequest from '../../middleware/validation';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.teacher),
    validateRequest(AttendanceValidation.attendanceSchema),
    AttendanceController.createAttendance,
  )
  .get(
    '/history',
    auth(USER_ROLE.teacher),
    AttendanceController.getAttendanceHistory,
  )
  .get("/my_attendance", auth(USER_ROLE.student), AttendanceController.getMyAttendance)
  .get("/my_attendance/details", auth(USER_ROLE.student), AttendanceController.getMyAttendanceDetails);

export const AttendanceRoutes = router;
