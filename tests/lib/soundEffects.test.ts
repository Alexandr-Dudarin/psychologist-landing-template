import { afterEach, describe, expect, it } from "vitest";

import { siteSettings } from "../../src/data/siteSettings";
import {
  getSoundEffectVolume,
  isSoundEffectEnabled,
  playBookingCtaSound,
  playBookingStepSound,
  playBookingSuccessSound,
  prepareSoundEffects,
} from "../../src/lib/sound/soundEffects";

const originalSoundEffects = { ...siteSettings.soundEffects };

describe("soundEffects", () => {
  afterEach(() => {
    Object.assign(siteSettings.soundEffects, originalSoundEffects);
  });

  it("respects the global enabled flag", () => {
    siteSettings.soundEffects.enabled = false;

    expect(isSoundEffectEnabled("bookingCta")).toBe(false);
    expect(isSoundEffectEnabled("bookingStep")).toBe(false);
    expect(isSoundEffectEnabled("bookingSuccess")).toBe(false);
    expect(isSoundEffectEnabled("paymentSuccess")).toBe(false);
  });

  it("enables configured sound effects when global flag is enabled", () => {
    siteSettings.soundEffects.enabled = true;
    siteSettings.soundEffects.volume = 0.16;

    expect(isSoundEffectEnabled("bookingCta")).toBe(true);
    expect(isSoundEffectEnabled("bookingStep")).toBe(true);
    expect(isSoundEffectEnabled("bookingSuccess")).toBe(true);
    expect(isSoundEffectEnabled("paymentSuccess")).toBe(false);
  });

  it("clamps volume to a safe range", () => {
    siteSettings.soundEffects.volume = 2;
    expect(getSoundEffectVolume()).toBe(1);

    siteSettings.soundEffects.volume = -1;
    expect(getSoundEffectVolume()).toBe(0);
  });

  it("does not throw when Web Audio API is unavailable", () => {
    siteSettings.soundEffects.enabled = true;

    expect(() => prepareSoundEffects()).not.toThrow();
    expect(() => playBookingCtaSound()).not.toThrow();
    expect(() => playBookingStepSound()).not.toThrow();
    expect(() => playBookingSuccessSound()).not.toThrow();
  });
});