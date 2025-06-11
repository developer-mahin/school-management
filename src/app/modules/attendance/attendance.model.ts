import { model, Schema } from 'mongoose';
import { TAttendance, TAttendanceStudent } from './attendance.interface';

const studentSchema = new Schema<TAttendanceStudent>({
  studentId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Student',
  },
});

const attendanceSchema = new Schema<TAttendance>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Class',
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'School',
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    totalStudents: {
      type: Number,
      required: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    days: {
      type: String,
      required: true,
      enum: [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ],
      trim: true,
    },
    presentStudents: [studentSchema],
    absentStudents: [studentSchema],
    date: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Attendance = model<TAttendance>('Attendance', attendanceSchema);
export default Attendance;
