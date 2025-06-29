import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import OverviewController from './overview.controller';

const router = Router();

router
  .get(
    '/teacher_overview',
    auth(USER_ROLE.teacher),
    OverviewController.getTeacherHomePageOverview,
  )
  .get(
    '/daily_weekly_monthly_attendance_rate',
    auth(USER_ROLE.teacher),
    OverviewController.getDailyWeeklyMonthlyAttendanceRate,
  );

export const OverviewRoutes = router;
