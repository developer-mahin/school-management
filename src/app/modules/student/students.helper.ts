/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { USER_ROLE } from '../../constant';
import Parents from '../parents/parents.model';
import User from '../user/user.model';
import { UserService } from '../user/user.service';
import Student from './student.model';
import sendNotification from '../../../socket/sendNotification';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import { MulterFile } from '../user/user.controller';
import fs from 'fs';
import xlsx from 'xlsx';
import School from '../school/school.model';
import Class from '../class/class.model';

async function createStudentWithProfile(
  payload: any,
  session: mongoose.ClientSession,
): Promise<mongoose.Document> {
  const findSchoolUser = await User.findOne({
    schoolId: payload.data.schoolId,
  });

  if (payload.phoneNumber) {
    const uniquePhoneNumber = await UserService.uniquePhoneNumber(
      payload.phoneNumber,
    );
    if (uniquePhoneNumber)
      throw new Error(
        `This ("${payload.phoneNumber}") Phone number already exists`,
      );
  }

  const [newUser] = await User.create(
    [
      {
        phoneNumber: payload.phoneNumber,
        role: USER_ROLE.student,
        name: payload.data.name,
        uid: payload.uid, // Use pre-generated UID
      },
    ],
    { session },
  );

  const [newProfile] = await Student.create(
    [
      {
        userId: newUser._id,
        ...payload.data,
      },
    ],
    { session },
  );

  const userIdField = `${USER_ROLE.student}Id`; // Fixed: use actual role value
  await User.findOneAndUpdate(
    { _id: newUser._id }, // Fixed: proper _id reference
    { [userIdField]: newProfile._id },
    { new: true, session },
  );

  const receiverId = findSchoolUser?._id;
  const message = `A New Student Has Been Created on ${new Date().toLocaleTimeString()}`;

  const user = {
    userId: newUser?._id,
    role: newUser?.role,
  } as any;

  await sendNotification(user, {
    senderId: newUser._id,
    role: user.role,
    receiverId,
    message,
    type: NOTIFICATION_TYPE.STUDENT,
    linkId: newUser._id,
  });

  return newProfile;
}

async function handleParentUserCreation(
  payload: any,
  student: any,
  session: mongoose.ClientSession,
) {
  if (!student || !student._id) return;

  const parentPhoneNumbers = [
    {
      phoneNumber: payload.fatherPhoneNumber,
      role: USER_ROLE.parents,
      relation: 'father',
    },
    {
      phoneNumber: payload.motherPhoneNumber,
      role: USER_ROLE.parents,
      relation: 'mother',
    },
  ];

  delete payload.fatherPhoneNumber;
  delete payload.motherPhoneNumber;

  for (const { phoneNumber, role, relation } of parentPhoneNumbers) {
    if (!phoneNumber) continue;

    const existingUser = await User.findOne({ phoneNumber }).session(session);
    let user = existingUser;

    if (!user) {
      const [newUser] = await User.create(
        [
          {
            phoneNumber,
            role,
            relation,
          },
        ],
        { session },
      );
      user = newUser;

      const findSchoolUser = await User.findOne({
        schoolId: payload?.schoolId,
      });

      const receiverId = findSchoolUser?._id;
      const message = `Parent Has Been Created on ${new Date().toLocaleTimeString()}`;

      await sendNotification(user as any, {
        senderId: user?._id || receiverId,
        role: user.role,
        receiverId,
        message,
        type: NOTIFICATION_TYPE.PARENT,
        linkId: newUser._id,
      });
    }

    const [newProfile] = await Parents.create(
      [
        {
          userId: user._id,
          ...payload.data,
          childId: student._id,
          schoolId: payload.schoolId,
        },
      ],
      { session },
    );

    console.log(newProfile, 'After newProfile ===============>');

    if (!existingUser) {
      const userIdField = `${role}Id`;
      await User.findOneAndUpdate(
        { _id: user._id }, // Fixed: proper _id reference
        { [userIdField]: newProfile._id },
        { new: true, session },
      );
    }
  }
}

const parseStudentXlsxData = async (file: MulterFile) => {
  const fileBuffer = fs.readFileSync(file.path);
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  // Read sheet as an array of arrays
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
  });

  const [headerRow, ...rows] = rawData as [string[], ...any[]];
  const headers = headerRow.map((header) => header.trim());

  const stringFields = [
    'name',
    'phoneNumber',
    'fatherPhoneNumber',
    'motherPhoneNumber',
    'className',
    'schoolName',
    'section',
  ];

  const parsedData = rows.map((row) => {
    return headers.reduce(
      (obj, header, index) => {
        let fieldValue = row[index] || '';

        fieldValue = fieldValue?.toString().trim();

        if (typeof fieldValue === 'string') {
          if (fieldValue.startsWith('"') && fieldValue.endsWith('"')) {
            fieldValue = fieldValue.slice(1, -1).replace(/""/g, '"');
          }
        }

        obj[header] = stringFields.includes(header)
          ? fieldValue
          : fieldValue.includes(',')
            ? fieldValue.split(',').map((item: string) => item.trim())
            : fieldValue;

        return obj;
      },
      {} as Record<string, string | string[]>,
    );
  });

  const enrichedData = await Promise.all(
    parsedData.map(async (row) => {
      const school = await School.findOne({
        schoolName: row.schoolName,
      });

      const classData = await Class.findOne({
        className: row.className,
        schoolId: school?.id,
      });

      return {
        ...row,
        schoolId: school?.id || null,
        classId: classData?.id || null,
      };
    }),
  );

  return enrichedData;
};

export {
  createStudentWithProfile,
  handleParentUserCreation,
  parseStudentXlsxData,
};
