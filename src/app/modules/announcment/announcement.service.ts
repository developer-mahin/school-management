import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import Parents from '../parents/parents.model';
import Student from '../student/student.model';
import Teacher from '../teacher/teacher.model';
import { TAnnouncement } from './announcement.interface';
import sendAnnouncement from '../../../socket/sendAnnouncement';
import Announcement from './announcement.model';

const createAnnouncement = async (
  payload: Partial<TAnnouncement>,
  user: TAuthUser,
) => {

  const [allStudent, allTeacher, allParents] = await Promise.all([
    Student.find({ schoolId: user.schoolId }),
    Teacher.find({ schoolId: user.schoolId }),
    Parents.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(String(user.schoolId)),
        }
      },
      {
        $group: {
          _id: "$userId",
        }
      },
      {
        $project: {
          userId: "$_id"
        }
      }
    ])
  ])

  const announcementData = {
    ...payload,
    schoolId: user.schoolId
  }

  const data = payload.announcementTo === "student" ? allStudent : payload.announcementTo === "teacher" ? allTeacher : allParents

  const sendAnnouncements = data.map((item) => {
    announcementData.receiverId = item.userId
    Announcement.create(announcementData)
    return sendAnnouncement(announcementData)
  })

  await Promise.all(sendAnnouncements)

};

export const AnnouncementService = {
  createAnnouncement,
};
