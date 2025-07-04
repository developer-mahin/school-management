import colors from 'colors';
import config from '../../config';
import { USER_ROLE } from '../constant';
import User from '../modules/user/user.model';

const seedAdmin = async () => {
  // if admin is not exist
  const admin = {
    phoneNumber: config.admin.admin_phone_number,
    role: USER_ROLE.supperAdmin,
  };

  const isAdminExist = await User.findOne({ role: USER_ROLE.supperAdmin });

  if (!isAdminExist) {
    const user = await User.create(admin);
    if (user) {
      console.log(colors.green(`Admin created successfully`).bold);
    }
  }
};

export default seedAdmin;
