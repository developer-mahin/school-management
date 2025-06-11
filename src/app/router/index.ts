import { Router } from 'express';
import { AssignmentRoutes } from '../modules/assignment/assignment.routes';
import { AssignmentSubmissionRoutes } from '../modules/assignmentSubmission/assignmentSubmission.routes';
import { AttendanceRoutes } from '../modules/attendance/attendance.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { ClassRoutes } from '../modules/class/class.routes';
import { ClassScheduleRoutes } from '../modules/classSchedule/classSchedule.routes';
import { ConversationRoutes } from '../modules/conversation/conversation.routes';
import { ExamRoutes } from '../modules/exam/exam.routes';
import { LevelRoutes } from '../modules/level/level.routes';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { SchoolRoutes } from '../modules/school/school.routes';
import { StaticContentRoutes } from '../modules/staticContent/staticContent.routes';
import { StudentRoutes } from '../modules/student/student.routes';
import { SubjectRoutes } from '../modules/subject/subject.routes';
import { SubscriptionRoutes } from '../modules/subscription/subscription.routes';
import { TeacherRoutes } from '../modules/teacher/teacher.routes';
import { TermsRoutes } from '../modules/terms/terms.routes';
import { UserRoutes } from '../modules/user/user.routes';

const router = Router();

type TRoutes = {
  path: string;
  route: Router;
};

const routes: TRoutes[] = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/school',
    route: SchoolRoutes,
  },
  {
    path: '/teacher',
    route: TeacherRoutes,
  },
  {
    path: '/student',
    route: StudentRoutes,
  },
  {
    path: '/level',
    route: LevelRoutes,
  },
  {
    path: '/class',
    route: ClassRoutes,
  },
  {
    path: '/class_schedule',
    route: ClassScheduleRoutes,
  },
  {
    path: '/attendance',
    route: AttendanceRoutes,
  },
  {
    path: '/assignment',
    route: AssignmentRoutes,
  },
  {
    path: '/assignment_submission',
    route: AssignmentSubmissionRoutes,
  },
  {
    path: '/subject',
    route: SubjectRoutes,
  },
  {
    path: '/terms',
    route: TermsRoutes,
  },
  {
    path: '/exam',
    route: ExamRoutes,
  },
  {
    path: '/payment',
    route: PaymentRoutes,
  },
  {
    path: '/subscription',
    route: SubscriptionRoutes,
  },
  {
    path: '/conversation',
    route: ConversationRoutes,
  },
  {
    path: '/notification',
    route: NotificationRoutes,
  },
  {
    path: '/static_content',
    route: StaticContentRoutes,
  },
];

routes.forEach((item) => {
  router.use(item.path, item.route);
});

export default router;
