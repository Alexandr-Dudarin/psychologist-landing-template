export type ReviewItem = {
  image: string;
  alt: string;
};

export type ReviewsContent = {
  eyebrow: string;
  title: string;
  description: string;
  items: ReviewItem[];
};