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

export const clientReviewStatuses = [
  "pending",
  "published",
  "hidden",
  "deleted",
] as const;

export type ClientReviewStatus = (typeof clientReviewStatuses)[number];

export type ClientReviewPublicRecord = {
  id: number;
  publicName: string;
  rating: number | null;
  text: string;
  publishedAt: string | null;
  createdAt: string;
};

export type ClientReviewAdminRecord = ClientReviewPublicRecord & {
  status: ClientReviewStatus;
  clientId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  eligibilitySessionId: number | null;
  adminNote: string;
  hiddenAt: string | null;
  deletedAt: string | null;
};

export type ClientReviewCreatePayload = {
  contact: string;
  publicName?: string;
  rating?: number | null;
  text: string;
  consentAccepted: boolean;
};

export type ClientReviewCreateSuccessResponse = {
  success: true;
  item: ClientReviewPublicRecord;
  message: string;
};

export type ClientReviewListSuccessResponse = {
  items: ClientReviewPublicRecord[];
};

export type ClientReviewErrorResponse = {
  error: string;
  code?: string;
};