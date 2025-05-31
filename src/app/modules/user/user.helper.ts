import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import School from '../school/school.model';
import Teacher from '../teacher/teacher.model';
import Student from '../student/student.model';
import Parents from '../parents/parents.model';
import User from './user.model';
import generateUID from '../../utils/generateUID';

type RoleModelsMap = {
  [USER_ROLE.school]: typeof School;
  [USER_ROLE.teacher]: typeof Teacher;
  [USER_ROLE.student]: typeof Student;
  [USER_ROLE.parents]: typeof Parents;
};

const roleModelMap: RoleModelsMap = {
  [USER_ROLE.school]: School,
  [USER_ROLE.teacher]: Teacher,
  [USER_ROLE.student]: Student,
  [USER_ROLE.parents]: Parents,
};

// Generic payload type: must include phoneNumber + any profile data
interface CreateUserPayload<T> {
  phoneNumber: string;
  role: 'parents' | 'student' | 'teacher' | 'school';
  data: T;
}

// Generic create function
export async function createUserWithProfile<T>(
  payload: CreateUserPayload<T & { name?: string }>,
): Promise<mongoose.Document> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create User
    const [newUser] = await User.create(
      [
        {
          uid: await generateUID(),
          phoneNumber: payload.phoneNumber,
          role: payload.role,
          name: payload.data.name,
        },
      ],
      { session },
    );

    if (!newUser) throw new Error('User not created');

    // 2. Get model for role
    const Model = roleModelMap[payload.role];

    if (!Model) throw new Error('Invalid role provided');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ModelAsAny = Model as any; // Temporary workaround
    const [newProfile] = await ModelAsAny.create(
      [
        {
          userId: newUser._id,
          ...payload.data,
        },
      ],
      { session },
    );
    if (!newProfile) throw new Error(`${payload.role} not created`);

    const userIdField = `${payload.role}Id`;

    const updateUser = await User.findOneAndUpdate(
      { _id: newUser._id },
      { [userIdField]: newProfile._id },
      { new: true, session },
    );

    if (!updateUser) throw new Error('User not updated');
    await session.commitTransaction();
    session.endSession();

    return newProfile;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}
