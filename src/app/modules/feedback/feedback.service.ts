/* eslint-disable @typescript-eslint/no-explicit-any */
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import { TFeedback } from './feedback.interface';
import Feedback from './feedback.model';

const addFeedback = async (payload: Partial<TFeedback>, user: TAuthUser) => {
  const feedbackBody = {
    ...payload,
    userId: user.userId,
  };

  const result = await Feedback.create(feedbackBody);
  return result;
};

const getFeedbackList = async (query: Record<string, unknown>) => {
  const feedbackQuery = new AggregationQueryBuilder(query);

  const result = await feedbackQuery
    .customPipeline([
      {
        $match: {},
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
    ])
    .sort()
    .search(['user.name'])
    .paginate()
    .execute(Feedback);

  const meta = await feedbackQuery.countTotal(Feedback);

  return { meta, result };
};

export const FeedbackService = {
  addFeedback,
  getFeedbackList,
};
