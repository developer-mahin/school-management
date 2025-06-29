/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import Parents from '../parents/parents.model';
import User from '../user/user.model';
import { UserService } from '../user/user.service';
import Student from './student.model';

async function createStudentWithProfile(
  payload: any,
  session: mongoose.ClientSession,
): Promise<mongoose.Document> {
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
    },
    {
      phoneNumber: payload.motherPhoneNumber,
      role: USER_ROLE.parents,
    },
  ];

  delete payload.fatherPhoneNumber;
  delete payload.motherPhoneNumber;

  for (const { phoneNumber, role } of parentPhoneNumbers) {
    if (!phoneNumber) continue;

    const existingUser = await User.findOne({ phoneNumber }).session(session);
    let user = existingUser;

    if (!user) {
      const [newUser] = await User.create(
        [
          {
            phoneNumber,
            role,
          },
        ],
        { session },
      );
      user = newUser;
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
