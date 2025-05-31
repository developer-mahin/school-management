import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { ConversationRoutes } from '../modules/conversation/conversation.routes';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { SchoolRoutes } from '../modules/school/school.routes';
import { StaticContentRoutes } from '../modules/staticContent/staticContent.routes';
import { SubscriptionRoutes } from '../modules/subscription/subscription.routes';
import { TeacherRoutes } from '../modules/teacher/teacher.routes';
import { UserRoutes } from '../modules/user/user.routes';
import { StudentRoutes } from '../modules/student/student.routes';
import { LevelRoutes } from '../modules/level/level.routes';
import { ClassRoutes } from '../modules/class/class.routes';
import { SubjectRoutes } from '../modules/subject/subject.routes';
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
    path: '/subject',
    route: SubjectRoutes,
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
