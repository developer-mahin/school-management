import { z } from 'zod';

const createAnnouncementValidation = z.object({
  body: z.object({
    date: z.string({ required_error: 'Date is required' }),
    title: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    announcementTo: z.string({ required_error: 'Announcement to is required' }),
  }),
});

export const AnnouncementValidation = {
  createAnnouncementValidation,
};
