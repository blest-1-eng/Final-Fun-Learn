let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
}

function tone(
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.2
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  } catch {
    // Ignore audio errors in headless/restricted environments
  }
}

export function soundTap(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  tone(620, ctx.currentTime, 0.08, 'sine', 0.12);
}

export function soundCorrect(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(261.63, now, 0.18, 'sine', 0.18);
  tone(523.25, now + 0.02, 0.18, 'triangle', 0.3);
  tone(659.25, now + 0.1, 0.18, 'triangle', 0.3);
  tone(783.99, now + 0.18, 0.2, 'triangle', 0.32);
  tone(1046.5, now + 0.26, 0.35, 'triangle', 0.35);
  tone(1318.51, now + 0.34, 0.4, 'sine', 0.25);
  const sparkles = [1567.98, 2093.0, 2637.02];
  sparkles.forEach((freq, idx) => {
    tone(freq, now + 0.15 + idx * 0.07, 0.12, 'sine', 0.12);
  });
}

export function soundWrong(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(160, now, 0.18, 'sawtooth', 0.18);
  tone(120, now + 0.12, 0.25, 'sawtooth', 0.18);
}

export function soundFinish(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
  notes.forEach((freq, index) => {
    tone(freq, now + index * 0.08, 0.2, 'triangle', 0.25);
  });
}

export function speakText(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis errors in restricted environments
  }
}

