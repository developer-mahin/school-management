import { ObjectId } from "mongoose";


export type TAttendanceStudent = {
    studentId: ObjectId
}

export type TAttendance = {
    classId: ObjectId;
    schoolId: ObjectId;
    className: string;
    totalStudents: number;
    presentStudents: TAttendanceStudent[];
    absentStudents: TAttendanceStudent[];
    date: Date;
}