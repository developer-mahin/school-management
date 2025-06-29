/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { USER_ROLE, USER_STATUS } from '../../constant';
import { TUser, UserModel } from './user.interface';

export const userSchema = new mongoose.Schema<TUser, UserModel>(
  {
    uid: {
      type: String,
      // required: [true, 'UID is required'],
      // unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    parentsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parents',
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
    image: {
      type: String,
    },
    relation: {
      type: String,
      enum: ['father', 'mother'],
    },
    role: {
      type: String,
      enum: [
        USER_ROLE.admin,
        USER_ROLE.supperAdmin,
        USER_ROLE.parents,
        USER_ROLE.school,
        USER_ROLE.teacher,
        USER_ROLE.student,
      ],
      default: USER_ROLE.student,
    },
    status: {
      type: String,
      enum: [USER_STATUS.active, USER_STATUS.blocked],
      default: USER_STATUS.active,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// query middlewares
userSchema.pre('find', async function (next) {
  const query = this as any;

  if (query.options.bypassMiddleware) {
    return next(); // Skip middleware if the flag is set
  }
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('findOne', async function (next) {
  const query = this as any;

  if (query.options.bypassMiddleware) {
    return next(); // Skip middleware if the flag is set
  }
  this.findOne({ isDeleted: { $ne: true } });
  next();
});

userSchema.statics.findLastUser = async function (
  className: string,
  section: string,
) {
  return await this.findOne(
    {
      uid: { $regex: `^${className}${section}-\\d{5}$` },
    },
    null,
    { bypassMiddleware: true },
  )
    .select('uid')
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();
};

userSchema.statics.isUserExist = async function (id: string) {
  return await User.findOne({ _id: id }).select('+password');
};

const User = mongoose.model<TUser, UserModel>('User', userSchema);

export default User;
