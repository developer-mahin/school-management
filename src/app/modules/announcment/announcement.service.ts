/* eslint-disable @typescript-eslint/no-explicit-any */
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
import sendNotification from '../../../socket/sendNotification';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import { cacheData, getCachedData } from '../../../redis';

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

  const receivers =
    payload.announcementTo === 'student'
      ? allStudent
      : payload.announcementTo === 'teacher'
        ? allTeacher
        : allParents;

  const announcementPromises = receivers.map(async (item) => {
    const receiverId = item.userId || item._id || item._doc?.userId;

    const newAnnouncement = await Announcement.create({
      ...payload,
      schoolId,
      receiverId,
    });

    const notificationData = {
      ...payload,
      message: payload.title,
      role: user.role,
      type: NOTIFICATION_TYPE.ANNOUNCEMENT,
      linkId: newAnnouncement._id,
      senderId: user.userId,
      receiverId,
    };

    await Promise.all([
      sendAnnouncement(newAnnouncement),
      sendNotification(user, notificationData),
    ]);
  });

  await Promise.all(announcementPromises);
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


  const cacheKey = `announcements:${user.userId}:${JSON.stringify(query)}`;

  // 🔍 Try to fetch from cache first
  const cached = await getCachedData<{ meta: any; result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving announcements from Redis cache');
    return cached;
  }

  const announcementQuery = new QueryBuilder(
    Announcement.find(matchStage),
    query,
  );

  const result = await announcementQuery.sort().search(['title']).paginate()
    .queryModel;

  const meta = await announcementQuery.countTotal();

  const dataToCache = { meta, result };

  // 💾 Store result in cache for 60 seconds
  await cacheData(cacheKey, dataToCache, 60);

  console.log('✅ Served fresh announcements and cached to Redis');
  return dataToCache;
};

export const AnnouncementService = {
  createAnnouncement,
  getAllAnnouncements,
};
