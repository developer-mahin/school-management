import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Teacher from '../teacher/teacher.model';
import { TAttendance } from './attendance.interface';
import Student from '../student/student.model';
import Attendance from './attendance.model';

const createAttendance = async (
    payload: Partial<TAttendance>,
    user: TAuthUser,
) => {
    const findTeacher = await Teacher.findById(user.teacherId);
    if (!findTeacher) throw new AppError(httpStatus.NOT_FOUND, 'Teacher not found');

    const totalStudents = await Student.find({
        schoolId: findTeacher.schoolId,
        classId: payload.classId,
        className: payload.className,
        section: payload.section,
    }).countDocuments();

    const presentStudents = payload.presentStudents!.map((studentId) => {
        return {
            studentId: studentId,
        }
    });

    const absentStudents = payload.absentStudents!.map((studentId) => {
        return {
            studentId: studentId,
        }
    });

    const attendance = await Attendance.create({
        ...payload,
        totalStudents,
        presentStudents,
        absentStudents,
        schoolId: findTeacher.schoolId,
        date: new Date(),
    })

    return attendance
};

export const AttendanceService = {
    createAttendance,
};
