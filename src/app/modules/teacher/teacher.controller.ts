import { TAuthUser } from "../../interface/authUser";
import catchAsync from "../../utils/catchAsync";
import { TeacherService } from "./teacher.service";

const createTeacher = catchAsync(async (req, res) => {
    const result = await TeacherService.createTeacher(req.body, req.user as TAuthUser);
    res.status(201).json({
        success: true,
        statusCode: 201,
        message: "Teacher created successfully",
        data: result,
    });
});

export const TeacherController = {
    createTeacher,
};