# Attendance Reset Cron Job Implementation

## Overview

This implementation adds a daily cron job to automatically reset the `isAttendance` property of class schedules to `false` every day at midnight.

## Problem Statement

When attendance is taken for a specific class (e.g., on Saturday), the `isAttendance` property is set to `true`. However, when the next day (Sunday) comes, the previous day's `isAttendance` (Saturday) should automatically reset to `false` to allow attendance to be taken again for the same class schedule.

## Solution

A cron job has been implemented that runs daily at 12:00 AM (midnight) to reset all `isAttendance` fields to `false`.

## Files Modified/Created

### 1. `src/app/modules/classSchedule/classSchedule.model.ts`

- **Change**: Added `default: false` to the `isAttendance` field in the schema
- **Purpose**: Ensures new class schedules are created with `isAttendance` set to `false` by default

### 2. `src/app/modules/classSchedule/classSchedule.service.ts`

- **Change**: Added a new function `resetAttendanceDaily()`
- **Purpose**: Updates all class schedules with `isAttendance: true` to `isAttendance: false`
- **Implementation**:
  ```typescript
  const resetAttendanceDaily = async () => {
    try {
      const result = await ClassSchedule.updateMany(
        { isAttendance: true },
        { $set: { isAttendance: false } },
      );

      console.log(
        `Reset attendance for ${result.modifiedCount} class schedules`,
      );
      return result;
    } catch (error) {
      console.error('Error resetting attendance:', error);
      throw error;
    }
  };
  ```

### 3. `src/app/modules/classSchedule/classSchedule.cron.ts` (NEW FILE)

- **Purpose**: Schedules and executes the daily attendance reset cron job
- **Cron Expression**: `'0 0 * * *'` (runs every day at 12:00 AM)
- **Features**:
  - Logs when the reset starts
  - Logs the number of schedules reset
  - Logs any errors that occur during the reset
  - Logs successful completion

### 4. `src/server.ts`

- **Change**: Imported and called `scheduleAttendanceReset()` in the main function
- **Purpose**: Initializes the cron job when the server starts

## How It Works

1. **On Server Start**: The `scheduleAttendanceReset()` function is called, which sets up the cron job
2. **Daily at Midnight**: The cron job automatically triggers at 12:00 AM
3. **Reset Process**: The job finds all class schedules with `isAttendance: true` and sets them to `false`
4. **Logging**: All actions are logged for monitoring and debugging

## Testing

To test the cron job, you can temporarily modify the cron expression. For example:

- `'* * * * *'` - Runs every minute (for testing purposes)
- `'0 0 * * *'` - Runs every day at midnight (production)

## Usage in Code

When attendance is taken (in `attendance.service.ts`), the code updates the class schedule:

```typescript
await ClassSchedule.findByIdAndUpdate(
  payload.classScheduleId,
  { isAttendance: true },
  { new: true },
);
```

The cron job automatically resets this back to `false` the next day, allowing attendance to be taken again.

## Benefits

1. **Automatic Reset**: No manual intervention needed
2. **Reliable**: Scheduled task runs automatically every day
3. **Logged**: All actions are logged for audit purposes
4. **Non-intrusive**: Runs in the background without affecting user operations
5. **Scalable**: Can handle any number of class schedules

## Future Enhancements

Potential improvements could include:

- Configurable reset time via environment variables
- Timezone support for different regions
- Manual trigger endpoint for testing
- Batch processing for very large datasets
- Email notifications when reset completes
