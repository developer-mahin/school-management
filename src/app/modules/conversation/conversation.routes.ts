import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
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
  );

export const ConversationRoutes = router;
