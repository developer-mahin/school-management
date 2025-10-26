import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import { ConversationController } from './conversation.controller';

const router = Router();

router
  .post(
    '/create',
    auth(
      USER_ROLE.admin,
      USER_ROLE.parents,
      USER_ROLE.teacher,
      USER_ROLE.student,
      USER_ROLE.school,
      USER_ROLE.supperAdmin,
    ),
    ConversationController.createConversation,
  )
  .get(
    '/',
    auth(
      USER_ROLE.admin,
      USER_ROLE.parents,
      USER_ROLE.teacher,
      USER_ROLE.student,
      USER_ROLE.school,
      USER_ROLE.supperAdmin,
    ),
    ConversationController.getConversations,
  )
  .get(
    '/messages/:conversationId',
    auth(
      USER_ROLE.admin,
      USER_ROLE.parents,
      USER_ROLE.teacher,
      USER_ROLE.student,
      USER_ROLE.school,
      USER_ROLE.supperAdmin,
    ),
    ConversationController.getMessages,
  )
  .patch(
    '/mark_read/:conversationId',
    auth(
      USER_ROLE.admin,
      USER_ROLE.parents,
      USER_ROLE.teacher,
      USER_ROLE.student,
      USER_ROLE.school,
      USER_ROLE.supperAdmin,
    ),
    ConversationController.markAllAsRead,
  );

export const ConversationRoutes = router;
