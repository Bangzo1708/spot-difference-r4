// Sounds only: every effect is a small WebAudio oscillator phrase, so the
// game needs no audio files. The context is created lazily on the first
// user gesture (browsers block audio before one) and a mute flag silences it.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  /** One note: a sine/triangle tone that fades out over `length` seconds. */
  function note(freq, at, length, type, gain) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0, ctx.currentTime + at);
    amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + at + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + length);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(ctx.currentTime + at);
    osc.stop(ctx.currentTime + at + length + 0.05);
  }

  /** A find: two bright notes rising. */
  function playFind() {
    note(660, 0, 0.18, 'sine', 0.22);
    note(990, 0.09, 0.26, 'sine', 0.22);
  }

  /** The golden difference: a sparkling four-note run. */
  function playGolden() {
    note(523, 0, 0.16, 'triangle', 0.2);
    note(659, 0.08, 0.16, 'triangle', 0.2);
    note(784, 0.16, 0.16, 'triangle', 0.2);
    note(1047, 0.24, 0.4, 'sine', 0.24);
  }

  /** A miss: one low dull thud. */
  function playMiss() {
    note(140, 0, 0.3, 'sawtooth', 0.12);
    note(98, 0.05, 0.32, 'sawtooth', 0.1);
  }

  /** A hint: a soft high ping. */
  function playHint() {
    note(1175, 0, 0.22, 'sine', 0.14);
    note(1568, 0.1, 0.3, 'sine', 0.1);
  }

  /** Scene clear: a rising major arpeggio. */
  function playClear() {
    note(523, 0, 0.2, 'triangle', 0.2);
    note(659, 0.12, 0.2, 'triangle', 0.2);
    note(784, 0.24, 0.2, 'triangle', 0.2);
    note(1047, 0.36, 0.5, 'sine', 0.22);
  }

  /** Game over: a short falling phrase. */
  function playOver() {
    note(392, 0, 0.25, 'triangle', 0.18);
    note(330, 0.2, 0.25, 'triangle', 0.18);
    note(262, 0.4, 0.5, 'triangle', 0.18);
  }

  /** A click on a button or card. */
  function playClick() {
    note(880, 0, 0.08, 'sine', 0.12);
  }

  function toggleMute() {
    muted = !muted;
    return muted;
  }

  function isMuted() {
    return muted;
  }

  return { playFind, playGolden, playMiss, playHint, playClear, playOver, playClick, toggleMute, isMuted };
}
