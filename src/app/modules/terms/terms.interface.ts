import { ObjectId } from 'mongoose';

export type TTerms = {
  schoolId: ObjectId;
  termsName: string;
};
