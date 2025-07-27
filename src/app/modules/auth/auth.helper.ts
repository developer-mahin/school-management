/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_ROLE } from '../../constant';
import Manager from '../manager/manager.model';
import Parents from '../parents/parents.model';
import School from '../school/school.model';
import Student from '../student/student.model';
import Teacher from '../teacher/teacher.model';

export const getSchoolByRole = async (user: any): Promise<any> => {
  const roleMap = {
    [USER_ROLE.student]: async () => {
      const student = await Student.findById(user.studentId);
      return School.findById(student?.schoolId);
    },
    [USER_ROLE.teacher]: async () => {
      const teacher = await Teacher.findById(user.teacherId);
      return School.findById(teacher?.schoolId);
    },
    [USER_ROLE.parents]: async () => {
      const parent = await Parents.findById(user.parentsId);
      return School.findById(parent?.schoolId);
    },
    [USER_ROLE.manager]: async () => {
      const manager = await Manager.findById(user.managerId);
      return School.findById(manager?.schoolId);
    },
  };

  const role = user.role as keyof typeof roleMap;

  if (role in roleMap) {
    return roleMap[role]();
  }

  return School.findById(user.schoolId);
};

export const createUserPayload = (
  override: Partial<any> = {},
  user: any,
  school: any,
) => ({
  userId: user._id,
  studentId: user.studentId,
  parentsId: user.parentsId,
  schoolId: user.schoolId,
  teacherId: user.teacherId,
  managerId: user.managerId,
  phoneNumber: user.phoneNumber,
  role: user.role,
  name: user.name,
  image: user.image,
  mySchoolUserId: school?.userId,
  mySchoolId: school?._id,
  ...override,
});
