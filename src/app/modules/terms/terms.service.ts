import { TAuthUser } from '../../interface/authUser';
import { TTerms } from './terms.interface';
import Terms from './terms.model';

export const TermsService = {
  createTerms: async (payload: Partial<TTerms>, user: TAuthUser) => {
    const result = await Terms.create({ ...payload, schoolId: user.schoolId });
    return result;
  },

  getAllTerms: async (user: TAuthUser) => {
    const result = await Terms.find({ schoolId: user.schoolId });
    return result;
  },

  updateTerms: async (
    id: string,
    payload: Partial<TTerms>,
    user: TAuthUser,
  ) => {
    const result = await Terms.findOneAndUpdate(
      { _id: id, schoolId: user.schoolId },
      payload,
      { new: true },
    );
    return result;
  },

  deleteTerms: async (id: string, user: TAuthUser) => {
    const result = await Terms.findOneAndDelete({
      _id: id,
      schoolId: user.schoolId,
    });
    return result;
  },
};
