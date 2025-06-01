/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import School from '../school/school.model';
import { createUserWithProfile } from '../user/user.helper';
import { TStudent } from './student.interface';

const createStudent = async (
  payload: Partial<TStudent> & { phoneNumber: string; name?: string },
  user: TAuthUser,
) => {
  if (user.role === USER_ROLE.school) {
    const findSchool = await School.findById(user.schoolId);
    payload.schoolId = user.schoolId as any;
    payload.schoolName = findSchool?.schoolName;
  }

  const student = (await createUserWithProfile({
    phoneNumber: payload.phoneNumber,
    role: USER_ROLE.student,
    data: payload,
  })) as any;

  if (Object.keys(student).length > 0) {
    const parentsNumbers = [
      { phoneNumber: payload.fatherPhoneNumber, role: USER_ROLE.parents },
      { phoneNumber: payload.motherPhoneNumber, role: USER_ROLE.parents },
    ];

    delete payload.fatherPhoneNumber;
    delete payload.motherPhoneNumber;

    for (const item of parentsNumbers) {
      if (item.phoneNumber) {
        // Check phoneNumber exists
        await createUserWithProfile({
          phoneNumber: item.phoneNumber,
          role: item.role,
          data: { ...payload, childId: student._id },
        });
      }
    }
  }

  return student;
};

export const StudentService = {
  createStudent,
};
