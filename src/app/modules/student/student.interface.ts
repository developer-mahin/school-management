import { ObjectId } from "mongoose"

export type TStudent = {
    userId: ObjectId;
    schoolId: ObjectId;
    classId: ObjectId;
    schoolName: string;
    className: string;
    studentName: string;
    fatherPhoneNumber: string;
    motherPhoneNumber: string;
}