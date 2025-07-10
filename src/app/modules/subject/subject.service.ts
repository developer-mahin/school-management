/* eslint-disable @typescript-eslint/no-explicit-any */
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { getSchoolIdFromUser } from '../../utils/getSchoolIdForManager';
import School from '../school/school.model';
import { TeacherService } from '../teacher/teacher.service';
import { TSubject } from './subject.interface';
import Subject from './subject.model';

const createSubject = async (payload: Partial<TSubject>, user: TAuthUser) => {
  const schoolId = getSchoolIdFromUser(user);

  const result = await Subject.create({ ...payload, schoolId });
  return result;
};

const getSubject = async (user: TAuthUser, query: Record<string, unknown>) => {
  let schoolId = user.schoolId;

  if (user.role === USER_ROLE.teacher) {
    const findTeacher = await TeacherService.findTeacher(user);
    schoolId = findTeacher?.schoolId as any;
  } else if (user.role === USER_ROLE.manager) {
    schoolId = getSchoolIdFromUser(user);
  } else if (user.role === USER_ROLE.supperAdmin) {
    const findSchool = await School.findOne({
      _id: query.schoolId,
    });

    schoolId = findSchool?._id as any;
  }

  const subjectQuery = new QueryBuilder(
    Subject.find({
      schoolId: schoolId,
    }),
    query,
  );
  const result = await subjectQuery.sort().paginate().search(['subjectName'])
    .queryModel;

  const meta = await subjectQuery.countTotal();
  return { meta, result };
};

const updateSubject = async (
  payload: Partial<TSubject> & { subjectId: string },
  user: TAuthUser,
) => {
  const result = await Subject.findOneAndUpdate(
    { _id: payload.subjectId, schoolId: user.schoolId },
    payload,
    { new: true },
  );
  return result;
};

const deleteSubject = async (id: string, user: TAuthUser) => {
  const result = await Subject.findOneAndDelete({
    _id: id,
    schoolId: user.schoolId,
  });
  return result;
};

export const SubjectService = {
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject,
};
