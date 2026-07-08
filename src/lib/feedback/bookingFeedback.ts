import {
  playBookingCtaSound,
  playBookingStepSound,
  playBookingSuccessSound,
} from "../sound/soundEffects";
import {
  triggerBookingCtaHaptic,
  triggerBookingStepHaptic,
  triggerBookingSuccessHaptic,
} from "../haptics/hapticFeedback";

export function playBookingCtaFeedback(): void {
  playBookingCtaSound();
  triggerBookingCtaHaptic();
}

export function playBookingStepFeedback(): void {
  playBookingStepSound();
  triggerBookingStepHaptic();
}

export function playBookingSuccessFeedback(): void {
  playBookingSuccessSound();
  triggerBookingSuccessHaptic();
}