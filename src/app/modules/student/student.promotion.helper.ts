/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { TAuthUser } from '../../interface/authUser';
import generateUID from '../../utils/generateUID';
import Class from '../class/class.model';
import Exam from '../exam/exam.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import Result from '../result/result.model';
import Terms from '../terms/terms.model';
import User from '../user/user.model';
import Student from './student.model';

/**
 * Check if student passed all subjects in a term
 * @param studentId - The student's ID
 * @param termsId - The term ID
 * @returns boolean - true if passed all subjects
 */
export const checkStudentPassedAllSubjects = async (
    studentId: string,
    termsId: string,
): Promise<{ passed: boolean; totalSubjects: number; passedSubjects: number }> => {
    // Get all exams for this term
    const exams = await Exam.find({
        termsId: new mongoose.Types.ObjectId(String(termsId)),
    });

    if (!exams || exams.length === 0) {
        return { passed: false, totalSubjects: 0, passedSubjects: 0 };
    }

    const examIds = exams.map((exam) => exam._id);

    // Get all results for this student in these exams
    const results = await Result.aggregate([
        {
            $match: {
                examId: { $in: examIds },
            },
        },
        {
            $unwind: '$students',
        },
        {
            $match: {
                'students.studentId': new mongoose.Types.ObjectId(String(studentId)),
            },
        },
        {
            $project: {
                examId: 1,
                grade: '$students.grade',
                gpa: '$students.gpa',
                mark: '$students.mark',
            },
        },
    ]);

    const totalSubjects = exams.length;
    const submittedSubjects = results.length;

    // Check if all subjects are submitted
    if (submittedSubjects < totalSubjects) {
        return {
            passed: false,
            totalSubjects,
            passedSubjects: submittedSubjects,
        };
    }

    // Check if all subjects are passed (no 'F' grade and gpa > 0)
    const passedSubjects = results.filter(
        (result) => result.grade !== 'F' && result.gpa > 0,
    ).length;

    const passed = passedSubjects === totalSubjects;

    return { passed, totalSubjects, passedSubjects };
};

/**
 * Extract class number from class name
 * @param className - e.g., "Class 1", "Grade 1", "1"
 * @returns number or null
 */
export const extractClassNumber = (className: string): number | null => {
    const match = className.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
};

/**
 * Find the next class in the same school
 * @param currentClassName - Current class name
 * @param schoolId - School ID
 * @returns Next class object or null
 */
export const findNextClass = async (
    currentClassName: string,
    schoolId: string,
): Promise<any> => {
    const currentClassNumber = extractClassNumber(currentClassName);

    if (!currentClassNumber) {
        return null;
    }

    const nextClassNumber = currentClassNumber + 1;

    // Find next class - try multiple formats
    const possibleNextClassNames = [
        `Class ${nextClassNumber}`,
        `Grade ${nextClassNumber}`,
        `${nextClassNumber}`,
        `class ${nextClassNumber}`,
        `grade ${nextClassNumber}`,
    ];

    const nextClass = await Class.findOne({
        schoolId: new mongoose.Types.ObjectId(String(schoolId)),
        className: { $in: possibleNextClassNames },
    });

    return nextClass;
};

/**
 * Promote student to next class
 * @param studentId - Student ID
 * @param termsId - Term ID
 * @param user - Auth user (teacher/school)
 * @returns Promotion result
 */
export const promoteStudentToNextClass = async (
    studentId: string,
    termsId: string,
    user: TAuthUser,
): Promise<{
    promoted: boolean;
    message: string;
    newClassName?: string;
    oldClassName?: string;
}> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Get term info to check if it's final term
        const term = await Terms.findById(termsId).session(session);
        if (!term) {
            await session.abortTransaction();
            session.endSession();
            return { promoted: false, message: 'Term not found' };
        }

        // Check if this is the final term (Second Term or Final Term)
        const isFinalTerm =
            term.termsName.toLowerCase().includes('second') ||
            term.termsName.toLowerCase().includes('final');

        if (!isFinalTerm) {
            await session.abortTransaction();
            session.endSession();
            return {
                promoted: false,
                message: 'Promotion only happens after final term',
            };
        }

        // Check if student passed all subjects
        const { passed, totalSubjects, passedSubjects } =
            await checkStudentPassedAllSubjects(studentId, termsId);

        if (!passed) {
            await session.abortTransaction();
            session.endSession();
            return {
                promoted: false,
                message: `Student did not pass all subjects (${passedSubjects}/${totalSubjects} passed)`,
            };
        }

        // Get student info
        const student = await Student.findById(studentId).session(session);
        if (!student) {
            await session.abortTransaction();
            session.endSession();
            return { promoted: false, message: 'Student not found' };
        }

        // Find next class
        const nextClass = await findNextClass(
            student.className,
            student.schoolId.toString(),
        );

        if (!nextClass) {
            await session.abortTransaction();
            session.endSession();
            return {
                promoted: false,
                message: `No next class found after ${student.className}`,
            };
        }

        const oldClassName = student.className;
        const newClassName = nextClass.className;

        // Keep the same section or use first available section
        const sections = nextClass.section
            .map((s: string) => s.replace(/\s*\/\s*/g, ','))
            .join(',')
            .split(',');
        const newSection = sections.includes(student.section)
            ? student.section
            : sections[0];

        // Generate new UID for the new class
        const newUID = await generateUID({
            className: newClassName,
            section: newSection,
        });

        // Update student record
        await Student.findByIdAndUpdate(
            studentId,
            {
                $set: {
                    classId: nextClass._id,
                    className: newClassName,
                    section: newSection,
                },
            },
            { session, new: true },
        );

        // Update user record with new UID
        await User.findByIdAndUpdate(
            student.userId,
            {
                $set: {
                    uid: newUID,
                },
            },
            { session, new: true },
        );

        // Send notification to student
        await sendNotification(user, {
            senderId: user.userId,
            role: user.role,
            receiverId: student.userId,
            message: `🎉 Congratulations! You have been promoted from ${oldClassName} to ${newClassName}!`,
            type: NOTIFICATION_TYPE.CUSTOM,
            linkId: studentId,
            senderName: user.name,
        });

        // Send notification to school admin
        if (user.mySchoolUserId) {
            await sendNotification(user, {
                senderId: user.userId,
                role: user.role,
                receiverId: user.mySchoolUserId,
                message: `Student promoted from ${oldClassName} to ${newClassName}`,
                type: NOTIFICATION_TYPE.CUSTOM,
                linkId: studentId,
                senderName: user.name,
            });
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return {
            promoted: true,
            message: `Student promoted from ${oldClassName} to ${newClassName}`,
            newClassName,
            oldClassName,
        };
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        // eslint-disable-next-line no-console
        console.error('Error in student promotion:', error);
        return { promoted: false, message: error.message || 'Promotion failed' };
    }
};

/**
 * Batch promote all eligible students in a class/term
 * @param termsId - Term ID
 * @param classId - Class ID
 * @param schoolId - School ID
 * @param user - Auth user
 * @returns Batch promotion result
 */
export const batchPromoteStudents = async (
    termsId: string,
    classId: string,
    schoolId: string,
    user: TAuthUser,
): Promise<{
    totalStudents: number;
    promotedStudents: number;
    failedStudents: number;
    details: any[];
}> => {
    // Get all students in the class
    const students = await Student.find({
        classId: new mongoose.Types.ObjectId(String(classId)),
        schoolId: new mongoose.Types.ObjectId(String(schoolId)),
    });

    // eslint-disable-next-line no-console
    const promotionResults = await Promise.all(
        students.map(async (student) => {
            const result = await promoteStudentToNextClass(
                student._id.toString(),
                termsId,
                user,
            );
            return {
                studentId: student._id,
                studentName: (await User.findById(student.userId))?.name,
                ...result,
            };
        }),
    );

    const promotedStudents = promotionResults.filter(
        (r) => r.promoted,
    ).length;
    const failedStudents = promotionResults.filter(
        (r) => !r.promoted,
    ).length;

    return {
        totalStudents: students.length,
        promotedStudents,
        failedStudents,
        details: promotionResults,
    };
};

