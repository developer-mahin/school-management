import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { UserController } from './user.controller';
import fileUpload from '../../utils/uploadImage';
import parseFormData from '../../middleware/parsedData';

const upload = fileUpload('./public/uploads/message_files/');

const router = Router();

router
  .post(
    '/create_admin',
    auth(USER_ROLE.supperAdmin, USER_ROLE.school),
    UserController.createAdmin,
  )
  .post(
    '/add_parents_message',
    auth(USER_ROLE.parents),
    UserController.addParentsMessage,
  )
  .post('/file_upload', upload.single('file'), UserController.fileUpload)

  .get('/', auth(USER_ROLE.admin), UserController.getAllCustomers)
  .get(
    '/all_admin',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin),
    UserController.getAllAdmin,
  )
  .get(
    '/count_total',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
    UserController.countTotal,
  )
  .get(
    '/my_profile',
    auth(
      USER_ROLE.parents,
      USER_ROLE.admin,
      USER_ROLE.supperAdmin,
      USER_ROLE.school,
      USER_ROLE.teacher,
      USER_ROLE.student,
    ),
    UserController.myProfile,
  )
  .get(
    '/user_overview',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
    UserController.userOverView,
  )
  .patch('/edit_admin', auth(USER_ROLE.supperAdmin), UserController.editAdmin)
  .patch(
    '/edit_profile',
    auth(
      USER_ROLE.parents,
      USER_ROLE.admin,
      USER_ROLE.supperAdmin,
      USER_ROLE.school,
      USER_ROLE.teacher,
      USER_ROLE.student,
    ),
    upload.fields([
      { name: 'image', maxCount: 2 },
      { name: 'coverImage', maxCount: 2 },
      { name: 'schoolImage', maxCount: 2 },
    ]),
    parseFormData,
    UserController.editProfile,
  )
  .patch(
    '/action',
    auth(USER_ROLE.admin, USER_ROLE.supperAdmin, USER_ROLE.school),
    UserController.updateUserActions,
  )
  .get(
    '/get_parents_message/:studentId',
    auth(
      USER_ROLE.parents,
      USER_ROLE.admin,
      USER_ROLE.supperAdmin,
      USER_ROLE.school,
      USER_ROLE.teacher,
    ),
    UserController.getParentsMessage,
  )
  .delete(
    '/delete_admin/:userId',
    auth(USER_ROLE.supperAdmin),
    UserController.deleteAdmin,
  );

export const UserRoutes = router;
