import { TAuthUser } from '../../interface/authUser';
import { TStaticContent } from './staticContent.interface';
import StaticContent from './staticContent.model';

const createStaticContent = async (
  user: TAuthUser,
  payload: Partial<TStaticContent>,
) => {
  const faq = await StaticContent.findOne({ type: 'faq' });
  if (payload.type === 'faq' && faq) {
    const result = await StaticContent.findByIdAndUpdate(
      faq._id,
      {
        $push: {
          faq: payload.faq,
        },
      },
      { new: true },
    );

    return result;
  }

  const result = await StaticContent.create({
    ...payload,
    userId: user.userId,
  });

  return result;
};

const getStaticContent = async (query: Record<string, unknown>) => {
  const result = await StaticContent.findOne({ ...query });
  return result;
};

export const StaticContentService = {
  createStaticContent,
  getStaticContent,
};
