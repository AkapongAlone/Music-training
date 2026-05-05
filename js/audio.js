// Lightweight chord synth using Web Audio API.
// One shared AudioContext, lazily created on first play.

const NOTE_TO_SEMITONE = {
  'C': 0,  'C#': 1, 'Db': 1,
  'D': 2,  'D#': 3, 'Eb': 3,
  'E': 4,  'E#': 5, 'Fb': 4,
  'F': 5,  'F#': 6, 'Gb': 6,
  'G': 7,  'G#': 8, 'Ab': 8,
  'A': 9,  'A#': 10, 'Bb': 10,
  'B': 11, 'B#': 0, 'Cb': 11,
};

const QUALITY_INTERVALS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
};

let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Play a triad. Root in octave 4, voiced as close-position chord.
export function playChord(root, quality = 'maj', { duration = 1.4, gain = 0.18 } = {}) {
  const ac = getCtx();
  if (!ac) return;

  const semis = NOTE_TO_SEMITONE[root];
  if (semis == null) return;
  const intervals = QUALITY_INTERVALS[quality] || QUALITY_INTERVALS.maj;

  const now = ac.currentTime;
  // Place root around C4 (MIDI 60) — keeps every key in a comfortable range.
  const rootMidi = 60 + semis;

  const master = ac.createGain();
  master.gain.value = 0;
  master.connect(ac.destination);

  // ADSR-ish envelope on the master bus.
  const attack = 0.015;
  const release = 0.5;
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(gain, now + attack);
  master.gain.setValueAtTime(gain, now + duration - release);
  master.gain.linearRampToValueAtTime(0, now + duration);

  for (const interval of intervals) {
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = midiToFreq(rootMidi + interval);
    osc.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }
}
