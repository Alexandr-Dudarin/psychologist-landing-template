export type GuidePlatform = "telegram-channel" | "instagram";

export type GuideItem = {
  platform: GuidePlatform;
  coverLabel: string;
  title: string;
  description: string;
  desktopButtonLabel: string;
  mobileButtonLabel: string;
};