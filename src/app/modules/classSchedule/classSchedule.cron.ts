import * as cron from 'node-cron';
import { logger } from '../../../shared/logger';
import { ClassScheduleService } from './classSchedule.service';

// Run the cron job every day at 12:00 AM (midnight)
// Cron expression: '0 0 * * *' means: minute=0, hour=0, every day of month, every month, every day of week
const scheduleAttendanceReset = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            logger.info('Starting daily attendance reset...');
            await ClassScheduleService.resetAttendanceDaily();
            logger.info('Daily attendance reset completed successfully');
        } catch (error) {
            logger.error('Error in daily attendance reset:', error);
        }
    });

    logger.info('Attendance reset cron job scheduled to run daily at 12:00 AM');
};

export { scheduleAttendanceReset };
