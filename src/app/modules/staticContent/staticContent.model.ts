import { model, Schema } from 'mongoose';
import { TFaq, TStaticContent } from './staticContent.interface';

const faqSchema = new Schema<TFaq>({
  title: { type: String, required: true },
  content: { type: String, required: true },
});

const staticContentSchema = new Schema<TStaticContent>(
  {
    type: {
      type: String,
      enum: ['privacy-policy', 'terms-of-service', 'faq'],
      required: true,
    },
    content: { type: String },
    faq: { type: [faqSchema] },
  },
  {
    timestamps: true,
  },
);

const StaticContent = model<TStaticContent>(
  'StaticContent',
  staticContentSchema,
);
export default StaticContent;
