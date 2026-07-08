import { afterEach, describe, expect, it, vi } from "vitest";

import { siteSettings } from "../../src/data/siteSettings";
import {
  getHapticFeedbackDuration,
  isHapticFeedbackEnabled,
  triggerBookingCtaHaptic,
  triggerBookingStepHaptic,
  triggerBookingSuccessHaptic,
} from "../../src/lib/haptics/hapticFeedback";

const originalHapticFeedback = { ...siteSettings.hapticFeedback };

describe("hapticFeedback", () => {
  afterEach(() => {
    Object.assign(siteSettings.hapticFeedback, originalHapticFeedback);
    vi.unstubAllGlobals();
  });

  it("respects the global enabled flag", () => {
    siteSettings.hapticFeedback.enabled = false;

    expect(isHapticFeedbackEnabled("bookingCta")).toBe(false);
    expect(isHapticFeedbackEnabled("bookingStep")).toBe(false);
    expect(isHapticFeedbackEnabled("bookingSuccess")).toBe(false);
  });

  it("enables configured haptic effects when global flag is enabled", () => {
    siteSettings.hapticFeedback.enabled = true;
    siteSettings.hapticFeedback.durationMs = 8;

    expect(isHapticFeedbackEnabled("bookingCta")).toBe(true);
    expect(isHapticFeedbackEnabled("bookingStep")).toBe(true);
    expect(isHapticFeedbackEnabled("bookingSuccess")).toBe(false);
  });

  it("clamps duration to a safe range", () => {
    siteSettings.hapticFeedback.durationMs = 200;
    expect(getHapticFeedbackDuration()).toBe(100);

    siteSettings.hapticFeedback.durationMs = -1;
    expect(getHapticFeedbackDuration()).toBe(0);
  });

  it("does not throw when Vibration API is unavailable", () => {
    siteSettings.hapticFeedback.enabled = true;

    expect(() => triggerBookingCtaHaptic()).not.toThrow();
    expect(() => triggerBookingStepHaptic()).not.toThrow();
    expect(() => triggerBookingSuccessHaptic()).not.toThrow();
  });

  it("triggers navigator vibration when supported", () => {
    const vibrate = vi.fn(() => true);

    siteSettings.hapticFeedback.enabled = true;
    siteSettings.hapticFeedback.durationMs = 8;
    siteSettings.hapticFeedback.bookingCta = true;

    vi.stubGlobal("navigator", { vibrate });

    triggerBookingCtaHaptic();

    expect(vibrate).toHaveBeenCalledWith(8);
  });

  it("does not trigger vibration for disabled effects", () => {
    const vibrate = vi.fn(() => true);

    siteSettings.hapticFeedback.enabled = true;
    siteSettings.hapticFeedback.durationMs = 8;
    siteSettings.hapticFeedback.bookingSuccess = false;

    vi.stubGlobal("navigator", { vibrate });

    triggerBookingSuccessHaptic();

    expect(vibrate).not.toHaveBeenCalled();
  });
});