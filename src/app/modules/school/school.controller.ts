import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SchoolService } from "./school.service";

const createSchool = catchAsync(async (req, res) => {
    const result = await SchoolService.createSchool(req.body);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: 'School created successfully',
        data: result,
    });
});

export const SchoolController = {
    createSchool,
};