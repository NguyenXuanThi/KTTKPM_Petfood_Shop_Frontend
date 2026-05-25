const SPIN_SRC = "/sounds/spin.mp3";
const REWARD_SRC = "/sounds/reward.mp3";

let spinAudio = null;
let rewardAudio = null;
let spinStopTimer = null;
let rewardStopTimer = null;
let fadeTimer = null;

const safePlay = (audio) => {
  if (!audio) return;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      // Browser autoplay/user-gesture policies should never break wheel UX.
    });
  }
};

const resetAudio = (audio) => {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
};

const clearTimer = (timer) => {
  if (timer) window.clearTimeout(timer);
};

const clearFadeTimer = () => {
  if (fadeTimer) {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
  }
};

export const preloadWheelAudio = () => {
  if (!spinAudio) {
    spinAudio = new Audio(SPIN_SRC);
    spinAudio.preload = "auto";
    spinAudio.volume = 0.25;
  }

  if (!rewardAudio) {
    rewardAudio = new Audio(REWARD_SRC);
    rewardAudio.preload = "auto";
    rewardAudio.volume = 0.35;
  }

  return { spinAudio, rewardAudio };
};

export const fadeOutAudio = (audio, durationMs = 500, resetAfterFade = true) => {
  if (!audio) return;
  clearFadeTimer();

  const startVolume = audio.volume;
  const steps = Math.max(1, Math.floor(durationMs / 50));
  const decrement = startVolume / steps;
  let currentStep = 0;

  fadeTimer = window.setInterval(() => {
    currentStep += 1;
    audio.volume = Math.max(0, startVolume - decrement * currentStep);

    if (currentStep >= steps) {
      window.clearInterval(fadeTimer);
      fadeTimer = null;
      audio.pause();
      if (resetAfterFade) audio.currentTime = 0;
      audio.volume = startVolume;
    }
  }, 50);
};

export const playSpinSound = ({ enabled = true, volume = 0.25, maxDurationMs = 4500, fadeMs = 600, startAtSeconds = 0 } = {}) => {
  if (!enabled) return;
  preloadWheelAudio();
  clearTimer(spinStopTimer);
  clearFadeTimer();
  stopSpinSound({ fade: false });

  spinAudio.volume = volume;
  spinAudio.currentTime = startAtSeconds;
  safePlay(spinAudio);

  spinStopTimer = window.setTimeout(() => {
    fadeOutAudio(spinAudio, fadeMs, true);
  }, Math.max(0, maxDurationMs - fadeMs));
};

export const stopSpinSound = ({ fade = true, fadeMs = 450 } = {}) => {
  clearTimer(spinStopTimer);
  spinStopTimer = null;
  if (!spinAudio) return;

  if (fade && !spinAudio.paused) {
    fadeOutAudio(spinAudio, fadeMs, true);
    return;
  }

  clearFadeTimer();
  resetAudio(spinAudio);
};

export const playRewardSound = ({ enabled = true, volume = 0.35, maxDurationMs = 1800 } = {}) => {
  if (!enabled) return;
  preloadWheelAudio();
  clearTimer(rewardStopTimer);
  stopRewardSound();

  rewardAudio.volume = volume;
  rewardAudio.currentTime = 0;
  safePlay(rewardAudio);

  rewardStopTimer = window.setTimeout(() => {
    stopRewardSound();
  }, maxDurationMs);
};

export const stopRewardSound = () => {
  clearTimer(rewardStopTimer);
  rewardStopTimer = null;
  resetAudio(rewardAudio);
};

export const stopAllWheelAudio = () => {
  clearTimer(spinStopTimer);
  clearTimer(rewardStopTimer);
  spinStopTimer = null;
  rewardStopTimer = null;
  clearFadeTimer();
  resetAudio(spinAudio);
  resetAudio(rewardAudio);
};
