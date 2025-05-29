import { USER_ROLE } from "../../constant";
import { createUserWithProfile } from "../user/user.helper";
import { TSchool } from "./school.interface";
import School from "./school.model";

const createSchool = async (payload: Partial<TSchool> & { phoneNumber: string, name?: string }) => {

    const newSchool = await createUserWithProfile({
        phoneNumber: payload.phoneNumber,
        role: USER_ROLE.school,
        data: payload,
    });

    return newSchool;
};

const getSchoolList = async () => {
    const schools = await School.find();
    return schools;
};

export const SchoolService = {
    createSchool,
    getSchoolList
};