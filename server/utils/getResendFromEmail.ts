/// <reference types="node" />

const DEFAULT_RESEND_FROM_EMAIL = "Website <onboarding@resend.dev>";

export function getResendFromEmail(): string {
  const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  return resendFromEmail || DEFAULT_RESEND_FROM_EMAIL;
}