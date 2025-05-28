import { USER_ROLE } from "../../constant";
import { createUserWithProfile } from "../user/user.helper";
import { TSchool } from "./school.interface";

const createSchool = async (payload: Partial<TSchool> & { phoneNumber: string, name?: string }) => {

    const newSchool = await createUserWithProfile({
        phoneNumber: payload.phoneNumber,
        role: USER_ROLE.school,
        data: payload,
    });

    return newSchool;
};

export const SchoolService = {
    createSchool,
};