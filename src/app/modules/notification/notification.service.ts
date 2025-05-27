import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import Notification from './notification.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createNotification = async (payload: any) => {
  const notification = new Notification(payload);
  await notification.save();
  return notification;
};

const getNotifications = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const notificationQuery = new AggregationQueryBuilder(query);

  const result = await notificationQuery
    .customPipeline([
      {
        $match: {},
      },
    ])
    .paginate()
    .sort()
    .execute(Notification);

  const meta = await notificationQuery.countTotal(Notification);
  return { meta, result };
};

export const NotificationService = {
  createNotification,
  getNotifications,
};
