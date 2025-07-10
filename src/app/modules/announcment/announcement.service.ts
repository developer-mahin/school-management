import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import Parents from '../parents/parents.model';
import Student from '../student/student.model';
import Teacher from '../teacher/teacher.model';
import { TAnnouncement } from './announcement.interface';
import sendAnnouncement from '../../../socket/sendAnnouncement';
import Announcement from './announcement.model';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { USER_ROLE } from '../../constant';
import { getSchoolIdFromUser } from '../../utils/getSchoolIdForManager';

const createAnnouncement = async (
  payload: Partial<TAnnouncement>,
  user: TAuthUser,
) => {
  const schoolId = getSchoolIdFromUser(user);

  const [allStudent, allTeacher, allParents] = await Promise.all([
    Student.find({ schoolId }),
    Teacher.find({ schoolId }),
    Parents.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(schoolId)),
        },
      },
      {
        $group: {
          _id: '$userId',
        },
      },
      {
        $project: {
          userId: '$_id',
        },
      },
    ]),
  ]);

  const announcementData = {
    ...payload,
    schoolId,
  };

  const data =
    payload.announcementTo === 'student'
      ? allStudent
      : payload.announcementTo === 'teacher'
        ? allTeacher
        : allParents;

  const sendAnnouncements = data.map((item) => {
    announcementData.receiverId = item.userId;
    Announcement.create(announcementData);
    return sendAnnouncement(announcementData);
  });

  await Promise.all(sendAnnouncements);
};

const getAllAnnouncements = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const schoolId = getSchoolIdFromUser(user);

  let matchStage = {};
  if (user.role !== USER_ROLE.school) {
    matchStage = { receiverId: user.userId };
  } else {
    matchStage = { schoolId };
  }

  const announcementQuery = new QueryBuilder(
    Announcement.find(matchStage),
    query,
  );

  const result = await announcementQuery.sort().search(['title']).paginate()
    .queryModel;

  const meta = await announcementQuery.countTotal();

  return { meta, result };
};

export const AnnouncementService = {
  createAnnouncement,
  getAllAnnouncements,
};
