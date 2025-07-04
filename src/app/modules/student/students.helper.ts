/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import Parents from '../parents/parents.model';
import User from '../user/user.model';
import { UserService } from '../user/user.service';
import Student from './student.model';
import sendNotification from '../../../socket/sendNotification';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';

async function createStudentWithProfile(
  payload: any,
  session: mongoose.ClientSession,
): Promise<mongoose.Document> {


  const findSchoolUser = await User.findOne({
    schoolId: payload.data.schoolId,
  });

  if (payload.phoneNumber) {
    const uniquePhoneNumber = await UserService.uniquePhoneNumber(
      payload.phoneNumber,
    );
    if (uniquePhoneNumber) throw new Error('Phone number already exists');
  }

  const [newUser] = await User.create(
    [
      {
        phoneNumber: payload.phoneNumber,
        role: USER_ROLE.student,
        name: payload.data.name,
        uid: payload.uid, // Use pre-generated UID
      },
    ],
    { session },
  );

  const [newProfile] = await Student.create(
    [
      {
        userId: newUser._id,
        ...payload.data,
      },
    ],
    { session },
  );

  const userIdField = `${USER_ROLE.student}Id`; // Fixed: use actual role value
  await User.findOneAndUpdate(
    { _id: newUser._id }, // Fixed: proper _id reference
    { [userIdField]: newProfile._id },
    { new: true, session },
  );

  const receiverId = findSchoolUser?._id;
  const message = `A New Student Has Been Created on ${new Date().toLocaleTimeString()}`;

  const user = {
    userId: newUser?._id,
    role: newUser?.role,
  } as any;

  await sendNotification(user, {
    senderId: newUser._id,
    role: user.role,
    receiverId,
    message,
    type: NOTIFICATION_TYPE.STUDENT,
    linkId: newUser._id,
  });

  return newProfile;
}

async function handleParentUserCreation(
  payload: any,
  student: any,
  session: mongoose.ClientSession,
) {
  if (!student || !student._id) return;

  const parentPhoneNumbers = [
    {
      phoneNumber: payload.fatherPhoneNumber,
      role: USER_ROLE.parents,
      relation: 'father',
    },
    {
      phoneNumber: payload.motherPhoneNumber,
      role: USER_ROLE.parents,
      relation: 'mother',
    },
  ];

  delete payload.fatherPhoneNumber;
  delete payload.motherPhoneNumber;

  for (const { phoneNumber, role, relation } of parentPhoneNumbers) {
    if (!phoneNumber) continue;

    const existingUser = await User.findOne({ phoneNumber }).session(session);
    let user = existingUser;

    if (!user) {
      const [newUser] = await User.create(
        [
          {
            phoneNumber,
            role,
            relation,
          },
        ],
        { session },
      );
      user = newUser;



      const findSchoolUser = await User.findOne({
        schoolId: payload?.schoolId,
      });

      const receiverId = findSchoolUser?._id;
      const message = `Parent Has Been Created on ${new Date().toLocaleTimeString()}`;

      await sendNotification(user as any, {
        senderId: user?._id || receiverId,
        role: user.role,
        receiverId,
        message,
        type: NOTIFICATION_TYPE.PARENT,
        linkId: newUser._id,
      });
    }


    const [newProfile] = await Parents.create(
      [
        {
          userId: user._id,
          ...payload.data,
          childId: student._id,
          schoolId: payload.schoolId,
        },
      ],
      { session },
    );

    console.log(newProfile, "After newProfile ===============>");

    if (!existingUser) {
      const userIdField = `${role}Id`;
      await User.findOneAndUpdate(
        { _id: user._id }, // Fixed: proper _id reference
        { [userIdField]: newProfile._id },
        { new: true, session },
      );
    }
  }
}

export { createStudentWithProfile, handleParentUserCreation };
