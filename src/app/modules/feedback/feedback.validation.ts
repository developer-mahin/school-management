import { z } from 'zod';

const feedbackValidation = z.object({
  body: z.object({
    review: z.string({ required_error: 'Comment is required' }),
    ratings: z.number({ required_error: 'Ratings is required' }),
  }),
});

const feedbackUpdateValidation = z.object({
  body: z.object({
    status: z.enum(['pending', 'resolved', 'rejected'], {
      required_error: 'Status is required',
    }),
  }),
});

export const FeedbackValidation = {
  feedbackValidation,
  feedbackUpdateValidation,
};
