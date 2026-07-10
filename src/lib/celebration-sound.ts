// Synthesized level-up fanfare via Web Audio API. No audio assets, no CDN.

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioContextCtor();
  }
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  return ctx;
}

function note(
  audioCtx: AudioContext,
  master: GainNode,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  peak: number,
) {
  const o = audioCtx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = audioCtx.createGain();
  const t0 = audioCtx.currentTime + start;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.012); // fast attack
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); // decay/release
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export function playCelebration(opts?: { grand?: boolean }): void {
  try {
    const audioCtx = getContext();
    const master = audioCtx.createGain();
    master.gain.value = 0.22; // headroom so overlapping voices don't clip
    master.connect(audioCtx.destination);

    // Bass hit — the "boom"
    note(audioCtx, master, 65.41, 0.0, 0.35, 'sine', 0.9);

    // Fanfare — rising arpeggio (C major)
    note(audioCtx, master, 523.25, 0.0, 0.5, 'triangle', 0.5); // C5
    note(audioCtx, master, 659.25, 0.08, 0.5, 'triangle', 0.5); // E5
    note(audioCtx, master, 783.99, 0.16, 0.5, 'triangle', 0.5); // G5
    note(audioCtx, master, 1046.5, 0.24, 0.5, 'triangle', 0.5); // C6

    // Held triumph chord
    note(audioCtx, master, 1046.5, 0.3, 0.7, 'triangle', 0.32); // C6
    note(audioCtx, master, 1318.51, 0.3, 0.7, 'triangle', 0.32); // E6
    note(audioCtx, master, 1567.98, 0.3, 0.7, 'triangle', 0.32); // G6

    // Shimmer tail
    note(audioCtx, master, 2093, 0.26, 0.4, 'sine', 0.12); // C7
    note(audioCtx, master, 3136, 0.26, 0.4, 'sine', 0.12); // ~D#7

    if (opts?.grand) {
      note(audioCtx, master, 2093, 0.42, 0.6, 'triangle', 0.4); // final flourish, C7
    }
  } catch {
    // audio unsupported — silent, visual feedback already covers it
  }
}
