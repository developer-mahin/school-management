import { ObjectId } from "mongoose";

export type TClass = {
    levelId: ObjectId;
    schoolId: ObjectId;
    className: string;
    levelName: string;
    section: string[];
}