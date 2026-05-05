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

export const AUDIO_STYLES = [
  { id: 'synth',  label: 'Synth'  },
  { id: 'piano',  label: 'Piano'  },
  { id: 'guitar', label: 'Guitar' },
  { id: 'organ',  label: 'Organ'  },
  { id: 'bell',   label: 'Bell'   },
];

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

// Play a diatonic triad. Root placed in octave 4.
export function playChord(root, quality = 'maj', style = 'synth') {
  const ac = getCtx();
  if (!ac) return;

  const semis = NOTE_TO_SEMITONE[root];
  if (semis == null) return;
  const intervals = QUALITY_INTERVALS[quality] || QUALITY_INTERVALS.maj;
  const rootMidi = 60 + semis;
  const freqs = intervals.map(i => midiToFreq(rootMidi + i));

  switch (style) {
    case 'piano':  return playPiano(ac, freqs);
    case 'guitar': return playGuitar(ac, freqs);
    case 'organ':  return playOrgan(ac, freqs);
    case 'bell':   return playBell(ac, freqs);
    default:       return playSynth(ac, freqs);
  }
}

// --- Style implementations -----------------------------------------------

function playSynth(ac, freqs) {
  const now = ac.currentTime;
  const master = makeGain(ac, 0);
  master.connect(ac.destination);
  envelope(master.gain, now, { attack: 0.015, peak: 0.18, sustain: 0.18, hold: 1.0, release: 0.5 });

  for (const f of freqs) {
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    osc.connect(master);
    osc.start(now);
    osc.stop(now + 1.8);
  }
}

function playPiano(ac, freqs) {
  const now = ac.currentTime;

  for (const f of freqs) {
    // Fundamental + 2nd harmonic for piano-ish timbre.
    const master = makeGain(ac, 0);
    master.connect(ac.destination);
    envelope(master.gain, now, { attack: 0.008, peak: 0.14, sustain: 0.06, hold: 0.2, release: 1.4 });

    [[1, 1.0], [2, 0.25], [4, 0.06]].forEach(([mult, vol]) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * mult;
      const g = makeGain(ac, vol);
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 2.5);
    });
  }
}

function playGuitar(ac, freqs) {
  const now = ac.currentTime;

  // Strum each note ~30ms apart for a natural pluck.
  freqs.forEach((f, i) => {
    const t = now + i * 0.03;
    const master = makeGain(ac, 0);
    master.connect(ac.destination);
    envelope(master.gain, t, { attack: 0.004, peak: 0.18, sustain: 0.02, hold: 0.05, release: 0.9 });

    // Sawtooth base + lowpass filter to round the pluck.
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;

    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = f * 6;
    filter.Q.value = 0.8;

    osc.connect(filter);
    filter.connect(master);
    osc.start(t);
    osc.stop(t + 1.2);
  });
}

function playOrgan(ac, freqs) {
  const now = ac.currentTime;
  const master = makeGain(ac, 0);
  master.connect(ac.destination);
  // Organ: slow attack, full sustain, abrupt cutoff.
  envelope(master.gain, now, { attack: 0.06, peak: 0.13, sustain: 0.13, hold: 1.2, release: 0.08 });

  for (const f of freqs) {
    [[1, 1.0], [2, 0.5], [3, 0.25], [4, 0.12]].forEach(([mult, vol]) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * mult;
      const g = makeGain(ac, vol);
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 1.6);
    });
  }
}

function playBell(ac, freqs) {
  const now = ac.currentTime;

  for (const f of freqs) {
    const master = makeGain(ac, 0);
    master.connect(ac.destination);
    // Bell: instant attack, very long exponential decay.
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.18, now + 0.005);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

    // Inharmonic partials typical of a bell.
    [[1, 1.0], [2.756, 0.35], [5.404, 0.12], [8.933, 0.06]].forEach(([mult, vol]) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * mult;
      const g = makeGain(ac, vol);
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 3.2);
    });
  }
}

// --- Helpers ---------------------------------------------------------------

function makeGain(ac, value) {
  const g = ac.createGain();
  g.gain.value = value;
  return g;
}

// Simple ADSR: ramp up to peak, hold, fade to release.
function envelope(param, now, { attack, peak, sustain, hold, release }) {
  param.setValueAtTime(0, now);
  param.linearRampToValueAtTime(peak, now + attack);
  param.linearRampToValueAtTime(sustain, now + attack + hold * 0.2);
  param.setValueAtTime(sustain, now + attack + hold);
  param.linearRampToValueAtTime(0, now + attack + hold + release);
}
