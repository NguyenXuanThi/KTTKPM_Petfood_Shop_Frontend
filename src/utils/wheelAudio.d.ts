type SpinSoundOptions = {
  enabled?: boolean;
  volume?: number;
  maxDurationMs?: number;
  fadeMs?: number;
  startAtSeconds?: number;
};

type StopSpinOptions = {
  fade?: boolean;
  fadeMs?: number;
};

type RewardSoundOptions = {
  enabled?: boolean;
  volume?: number;
  maxDurationMs?: number;
};

export function preloadWheelAudio(): { spinAudio: HTMLAudioElement | null; rewardAudio: HTMLAudioElement | null };
export function playSpinSound(options?: SpinSoundOptions): void;
export function stopSpinSound(options?: StopSpinOptions): void;
export function playRewardSound(options?: RewardSoundOptions): void;
export function stopRewardSound(): void;
export function stopAllWheelAudio(): void;
export function fadeOutAudio(audio: HTMLAudioElement | null, durationMs?: number, resetAfterFade?: boolean): void;
