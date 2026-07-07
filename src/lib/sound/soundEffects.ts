import { siteSettings } from "../../data/siteSettings";

type SoundEffectKey =
  | "bookingCta"
  | "bookingStep"
  | "bookingSuccess"
  | "paymentSuccess";

type BrowserWindowWithAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

type ToneOptions = {
  frequency: number;
  durationMs: number;
  delayMs?: number;
  gain: number;
  type?: OscillatorType;
};

let audioContext: AudioContext | null = null;

export function getSoundEffectVolume(): number {
  const volume = siteSettings.soundEffects.volume;

  if (!Number.isFinite(volume)) {
    return 0;
  }

  return Math.min(Math.max(volume, 0), 1);
}

export function isSoundEffectEnabled(effect: SoundEffectKey): boolean {
  return (
    siteSettings.soundEffects.enabled &&
    siteSettings.soundEffects[effect] &&
    getSoundEffectVolume() > 0
  );
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as BrowserWindowWithAudio;
  const AudioContextConstructor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextConstructor();
  }

  return audioContext;
}

export function prepareSoundEffects(): void {
  if (!siteSettings.soundEffects.enabled) {
    return;
  }

  const context = getAudioContext();

  if (!context || context.state !== "suspended") {
    return;
  }

  void context.resume().catch(() => {
    // Sound effects are optional. Never block the main user flow.
  });
}

function playTone(context: AudioContext, options: ToneOptions): void {
  const {
    frequency,
    durationMs,
    delayMs = 0,
    gain,
    type = "sine",
  } = options;

  const startAt = context.currentTime + delayMs / 1000;
  const endAt = startAt + durationMs / 1000;
  const safeGain = Math.max(gain * getSoundEffectVolume(), 0.0001);

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(safeGain, startAt + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(endAt + 0.02);
}

function playSoundEffect(
  effect: SoundEffectKey,
  playPattern: (context: AudioContext) => void
): void {
  if (!isSoundEffectEnabled(effect)) {
    return;
  }

  try {
    const context = getAudioContext();

    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume().catch(() => {
        // Sound effects are optional. Never block the main user flow.
      });
    }

    playPattern(context);
  } catch {
    // Sound effects are optional. Never block the main user flow.
  }
}

export function playBookingCtaSound(): void {
  playSoundEffect("bookingCta", (context) => {
    playTone(context, {
      frequency: 640,
      durationMs: 54,
      gain: 0.18,
      type: "triangle",
    });

    playTone(context, {
      frequency: 960,
      durationMs: 76,
      delayMs: 44,
      gain: 0.12,
      type: "sine",
    });
  });
}

export function playBookingStepSound(): void {
  playSoundEffect("bookingStep", (context) => {
    playTone(context, {
      frequency: 520,
      durationMs: 42,
      gain: 0.12,
      type: "triangle",
    });
  });
}

export function playBookingSuccessSound(): void {
  playSoundEffect("bookingSuccess", (context) => {
    playTone(context, {
      frequency: 660,
      durationMs: 90,
      gain: 0.14,
      type: "sine",
    });

    playTone(context, {
      frequency: 880,
      durationMs: 120,
      delayMs: 82,
      gain: 0.12,
      type: "sine",
    });

    playTone(context, {
      frequency: 1175,
      durationMs: 150,
      delayMs: 176,
      gain: 0.1,
      type: "sine",
    });
  });
}