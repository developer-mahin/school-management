import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { UserController } from './user.controller';

const router = Router();

router
  .post('/create_admin', auth(USER_ROLE.admin), UserController.createAdmin)
  .get('/', auth(USER_ROLE.admin), UserController.getAllCustomers)
  .get('/company', auth(USER_ROLE.admin), UserController.getAllCompany)
  .get(
    '/company_request',
    auth(USER_ROLE.admin),
    UserController.getAllCompanyRequest,
  )
  .get(
    '/driver_request',
    auth(USER_ROLE.hopperCompany, USER_ROLE.company),
    UserController.getAllDriverRequest,
  )
  .get('/all_admin', auth(USER_ROLE.admin), UserController.getAllAdmin)
  .get(
    '/customer_overview',
    auth(USER_ROLE.admin),
    UserController.customerOverview,
  )
  .patch(
    '/driver_request/action',
    auth(USER_ROLE.hopperCompany, USER_ROLE.company),
    UserController.driverRequestAction,
  )
  .patch(
    '/approve_request/action',
    auth(USER_ROLE.admin),
    UserController.approveRequest,
  )
  .get(
    '/company/:companyId',
    auth(USER_ROLE.admin),
    UserController.companyDetails,
  )
  .get(
    '/company_dispatched_history/:companyId',
    auth(USER_ROLE.admin),
    UserController.companyDispatchedHistory,
  )
  .patch(
    '/actions/:id',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany),
    UserController.updateUserActions,
  )
  .get(
    '/driver_performance/:driverId',
    auth(USER_ROLE.admin, USER_ROLE.company, USER_ROLE.hopperCompany),
    UserController.driverPerformance,
  );

export const UserRoutes = router;
