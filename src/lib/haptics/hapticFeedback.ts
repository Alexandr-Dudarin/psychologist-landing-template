import { siteSettings } from "../../data/siteSettings";

type HapticFeedbackKey = "bookingCta" | "bookingStep" | "bookingSuccess";

type NavigatorWithVibrate = Navigator & {
  vibrate?: (pattern: VibratePattern) => boolean;
};

export function getHapticFeedbackDuration(): number {
  const durationMs = siteSettings.hapticFeedback.durationMs;

  if (!Number.isFinite(durationMs)) {
    return 0;
  }

  return Math.min(Math.max(durationMs, 0), 100);
}

export function isHapticFeedbackEnabled(effect: HapticFeedbackKey): boolean {
  return (
    siteSettings.hapticFeedback.enabled &&
    siteSettings.hapticFeedback[effect] &&
    getHapticFeedbackDuration() > 0
  );
}

function triggerHapticFeedback(effect: HapticFeedbackKey): void {
  if (!isHapticFeedbackEnabled(effect)) {
    return;
  }

  if (typeof navigator === "undefined") {
    return;
  }

  const hapticNavigator = navigator as NavigatorWithVibrate;

  if (typeof hapticNavigator.vibrate !== "function") {
    return;
  }

  try {
    hapticNavigator.vibrate(getHapticFeedbackDuration());
  } catch {
    // Haptic feedback is optional. Never block the main user flow.
  }
}

export function triggerBookingCtaHaptic(): void {
  triggerHapticFeedback("bookingCta");
}

export function triggerBookingStepHaptic(): void {
  triggerHapticFeedback("bookingStep");
}

export function triggerBookingSuccessHaptic(): void {
  triggerHapticFeedback("bookingSuccess");
}