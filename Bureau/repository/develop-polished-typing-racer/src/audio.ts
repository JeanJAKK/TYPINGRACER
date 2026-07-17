// Lightweight audio synthesis for game sounds
const audioCtx =
  typeof window !== "undefined"
    ? new (window.AudioContext || (window as any).webkitAudioContext)()
    : null;

type BackgroundMusicMode = "upbeat" | "game";

const backgroundMusicSources: Record<BackgroundMusicMode, string[]> = {
  upbeat: ["/audio/is_upbeat_song.mpeg"],
  game: ["/audio/is_cool_song1.mpeg", "/audio/is_cool_song2.mpeg"],
};

let backgroundMusicAudio: HTMLAudioElement | null = null;
let backgroundMusicMode: BackgroundMusicMode | null = null;
let backgroundMusicIndex = 0;
let backgroundMusicToken = 0;

function ensureAudio() {
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function startBackgroundMusic(mode: BackgroundMusicMode) {
  if (typeof window === "undefined") return;

  ensureAudio();

  if (backgroundMusicAudio && backgroundMusicMode === mode) {
    return;
  }

  if (backgroundMusicAudio) {
    backgroundMusicAudio.pause();
    backgroundMusicAudio = null;
  }

  backgroundMusicMode = mode;

  const sources = backgroundMusicSources[mode];
  const track = new Audio(sources[backgroundMusicIndex]);
  track.preload = "auto";
  track.loop = false;
  track.volume = 0.6;

  const token = ++backgroundMusicToken;

  track.addEventListener("ended", () => {
    if (token !== backgroundMusicToken) return;
    backgroundMusicIndex = (backgroundMusicIndex + 1) % sources.length;
    startBackgroundMusic(mode);
  });

  track.addEventListener("error", () => {
    if (token !== backgroundMusicToken) return;
    backgroundMusicIndex = (backgroundMusicIndex + 1) % sources.length;
    startBackgroundMusic(mode);
  });

  backgroundMusicAudio = track;

  track.play().catch(() => {
    if (backgroundMusicAudio === track) {
      backgroundMusicAudio = null;
    }
  });
}

export function stopBackgroundMusic() {
  backgroundMusicToken += 1;

  if (backgroundMusicAudio) {
    backgroundMusicAudio.pause();
    backgroundMusicAudio.currentTime = 0;
    backgroundMusicAudio = null;
  }

  backgroundMusicMode = null;
  backgroundMusicIndex = 0;
}

export function playKeyPress() {
  ensureAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 800 + Math.random() * 200;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.08);
}

export function playCorrect() {
  ensureAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.frequency.setValueAtTime(523, audioCtx.currentTime);
  osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.06);
  osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.12);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.2);
}

export function playWrong() {
  ensureAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "square";
  osc.frequency.value = 180;
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.15);
}

export function playCombo() {
  ensureAudio();
  if (!audioCtx) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = audioCtx.currentTime + i * 0.05;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}

export function playGameOver() {
  ensureAudio();
  if (!audioCtx) return;
  const notes = [440, 370, 311, 262];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = audioCtx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

export function playCountdown() {
  ensureAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.2);
}

export function playStart() {
  ensureAudio();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.3);
}
