import { ObjectId } from "mongoose"

export type TClassSchedule = {
    schoolId: ObjectId;
    classId: ObjectId;
    subjectId: ObjectId;
    className: string;
    subjectName: string;
    period: string;
    description: string;
    teacherName: string;
    selectTime: string;
    section: string;
    endTime: string;
    date: Date;
    roomNo: string;
}