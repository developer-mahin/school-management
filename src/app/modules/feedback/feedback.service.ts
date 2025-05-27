/* eslint-disable @typescript-eslint/no-explicit-any */
import User from '../user/user.model';
import { TFeedback } from './feedback.interface';
import Feedback from './feedback.model';

const addFeedback = async (payload: Partial<TFeedback>, userId: string) => {
  const user = (await User.findById(userId).populate('profile')) as any;
  user.profile.feedback = user.profile.feedback + 1;

  const feedbackBody = {
    ...payload,
    staffId: userId,
    restaurantId: user?.myRestaurant,
  };

  const result = await Feedback.create(feedbackBody);
  await user.profile.save();
  return result;
};

export const FeedbackService = {
  addFeedback,
};
