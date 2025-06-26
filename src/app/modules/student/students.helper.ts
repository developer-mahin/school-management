import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import Parents from '../parents/parents.model';
import User from '../user/user.model';
import { UserService } from '../user/user.service';
import Student from './student.model';
import generateUID from '../../utils/generateUID';

async function createStudentWithProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        uid: payload.uid,
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

  const userIdField = `${payload.role}Id`;
  await User.findOneAndUpdate(
    { _id: newUser._id },
    { [userIdField]: newProfile._id },
    { new: true, session },
  );

  return newProfile;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleParentUserCreation(
  payload: any,
  student: any,
  session: mongoose.ClientSession,
) {
  if (!student || !student._id) return;

  const parentPhoneNumbers = [
    { phoneNumber: payload.fatherPhoneNumber, role: USER_ROLE.parents },
    { phoneNumber: payload.motherPhoneNumber, role: USER_ROLE.parents },
  ];

  delete payload.fatherPhoneNumber;
  delete payload.motherPhoneNumber;
  const userPromises = parentPhoneNumbers
    .filter((p) => p.phoneNumber)
    .map(async ({ phoneNumber, role }) => {
      const existingUser = await User.findOne({ phoneNumber }).session(session);
      let user = existingUser;
      // console.log(user, "last user");
      // console.log(phoneNumber, "phone number");
      // console.log(role, "role");
      const uid = await generateUID();

      console.log(uid, 'uid');

      return;
      if (!user) {
        const [newUser] = await User.create(
          [
            {
              phoneNumber,
              role,
              uid: await generateUID(),
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
          { _id: user._id },
          { [userIdField]: newProfile._id },
          { new: true, session },
        );
      }

      return { user, profile: newProfile };
    });

  // Wait for all operations to complete
  await Promise.all(userPromises);
}

export { createStudentWithProfile, handleParentUserCreation };
