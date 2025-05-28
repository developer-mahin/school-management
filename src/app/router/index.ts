import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { ConversationRoutes } from '../modules/conversation/conversation.routes';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { SubscriptionRoutes } from '../modules/subscription/subscription.routes';
import { UserRoutes } from '../modules/user/user.routes';
import { StaticContentRoutes } from '../modules/staticContent/staticContent.routes';
import { SchoolRoutes } from '../modules/school/school.routes';
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
