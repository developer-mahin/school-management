import { TAuthUser } from '../../interface/authUser';
import Parents from '../parents/parents.model';
import Student from '../student/student.model';
import Teacher from '../teacher/teacher.model';
import { TAnnouncement } from './announcement.interface';

const createAnnouncement = async (
  payload: Partial<TAnnouncement>,
  user: TAuthUser,
) => {
  const allStudent = await Student.find({ schoolId: user.schoolId });
  const allTeacher = await Teacher.find({ schoolId: user.schoolId });
  const allParents = await Parents.find({ schoolId: user.schoolId });
};

export const AnnouncementService = {
  createAnnouncement,
};
