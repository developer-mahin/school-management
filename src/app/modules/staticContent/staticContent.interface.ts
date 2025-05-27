export type TType = 'privacy-policy' | 'terms-of-service' | 'faq';

export type TFaq = {
  title: string;
  content: string;
};

export type TStaticContent = {
  type: TType;
  content?: string;
  faq?: TFaq[];
};
