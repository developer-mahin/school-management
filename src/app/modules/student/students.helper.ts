/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import generateUID from '../../utils/generateUID';
import Parents from '../parents/parents.model';
import User from '../user/user.model';

async function handleParentUserCreation(payload: any, student: any) {
    const parentsNumbers = [
        { phoneNumber: payload.fatherPhoneNumber, role: USER_ROLE.parents },
        { phoneNumber: payload.motherPhoneNumber, role: USER_ROLE.parents },
    ];

    if (Object.keys(student).length > 0) {
        delete payload.fatherPhoneNumber;
        delete payload.motherPhoneNumber;

        const creationPromises = parentsNumbers
            .filter(
                (item): item is { phoneNumber: string; role: typeof USER_ROLE.parents } =>
                    !!item.phoneNumber
            )
            .map(async (item) => {
                const existingUser = await User.findOne({ phoneNumber: item.phoneNumber });

                const session = await mongoose.startSession();
                session.startTransaction();

                try {
                    let user = existingUser;

                    // If user does not exist, create it
                    if (!user) {
                        const [newUser] = await User.create(
                            [
                                {
                                    uid: await generateUID(),
                                    phoneNumber: item.phoneNumber,
                                    role: item.role,
                                },
                            ],
                            { session }
                        );

                        if (!newUser) throw new Error('User not created');
                        user = newUser;
                    }

                    // Always create the Parents profile
                    const [newProfile] = await Parents.create(
                        [
                            {
                                userId: user._id,
                                ...payload.data,
                                childId: student._id,
                            },
                        ],
                        { session }
                    );

                    if (!newProfile) throw new Error(`${item.role} profile not created`);

                    // Only update the user if it was newly created (not already existing)
                    if (!existingUser) {
                        const userIdField = `${item.role}Id`;

                        const updatedUser = await User.findOneAndUpdate(
                            { _id: user._id },
                            { [userIdField]: newProfile._id },
                            { new: true, session }
                        );

                        if (!updatedUser) throw new Error('User update failed');
                    }

                    await session.commitTransaction();
                    session.endSession();

                    return newProfile;
                } catch (error) {
                    await session.abortTransaction();
                    session.endSession();
                    throw error;
                }
            });

        await Promise.all(creationPromises);
    }
}

export { handleParentUserCreation };
