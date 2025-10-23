/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import sendAnnouncement from '../../../socket/sendAnnouncement';
import sendNotification from '../../../socket/sendNotification';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import { getSchoolIdFromUser } from '../../utils/getSchoolIdForManager';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import Parents from '../parents/parents.model';
import Student from '../student/student.model';
import Teacher from '../teacher/teacher.model';
import { TAnnouncement } from './announcement.interface';
import Announcement from './announcement.model';

const createAnnouncement = async (
  payload: Partial<TAnnouncement>,
  user: TAuthUser,
) => {
  const schoolId = getSchoolIdFromUser(user);

  // Create a single announcement
  const newAnnouncement = await Announcement.create({
    ...payload,
    schoolId,
  });

  // Get all receivers based on announcement type
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

  const receivers =
    payload.announcementTo === 'student'
      ? allStudent
      : payload.announcementTo === 'teacher'
        ? allTeacher
        : allParents;

  // Send notifications to all receivers
  const notificationPromises = receivers.map(async (item) => {
    const receiverId = item.userId || item._id || item._doc?.userId;

    const notificationData = {
      ...payload,
      message: payload.title,
      role: user.role,
      type: NOTIFICATION_TYPE.ANNOUNCEMENT,
      linkId: newAnnouncement._id,
      senderId: user.userId,
      receiverId,
    };

    await sendNotification(user, notificationData);
  });

  await Promise.all([
    sendAnnouncement(newAnnouncement),
    ...notificationPromises,
  ]);
};

const getAllAnnouncements = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const schoolId = getSchoolIdFromUser(user);

  const matchStage: Record<string, unknown> = { schoolId };

  // Filter announcements based on user role
  if (user.role === USER_ROLE.student) {
    matchStage.announcementTo = 'student';
  } else if (user.role === USER_ROLE.teacher) {
    matchStage.announcementTo = 'teacher';
  } else if (user.role === USER_ROLE.parents) {
    matchStage.announcementTo = 'parents';
  }

  const announcementQuery = new QueryBuilder(
    Announcement.find(matchStage),
    query,
  );

  const result = await announcementQuery.sort().search(['title']).paginate()
    .queryModel;

  const meta = await announcementQuery.countTotal();

  const dataToCache = { meta, result };

  return dataToCache;
};

export const AnnouncementService = {
  createAnnouncement,
  getAllAnnouncements,
};
