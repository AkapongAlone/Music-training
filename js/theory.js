// Music theory utilities for the Nashville Number System.
// All chord/degree logic lives here so exercise modules can reuse it.

// Each major key with its proper enharmonic spelling.
// We pick the conventional spelling per key (Db over C#, Eb over D#, etc.).
export const KEY_SCALES = {
  'C':  ['C',  'D',  'E',  'F',  'G',  'A',  'B'],
  'Db': ['Db', 'Eb', 'F',  'Gb', 'Ab', 'Bb', 'C'],
  'D':  ['D',  'E',  'F#', 'G',  'A',  'B',  'C#'],
  'Eb': ['Eb', 'F',  'G',  'Ab', 'Bb', 'C',  'D'],
  'E':  ['E',  'F#', 'G#', 'A',  'B',  'C#', 'D#'],
  'F':  ['F',  'G',  'A',  'Bb', 'C',  'D',  'E'],
  'F#': ['F#', 'G#', 'A#', 'B',  'C#', 'D#', 'E#'],
  'G':  ['G',  'A',  'B',  'C',  'D',  'E',  'F#'],
  'Ab': ['Ab', 'Bb', 'C',  'Db', 'Eb', 'F',  'G'],
  'A':  ['A',  'B',  'C#', 'D',  'E',  'F#', 'G#'],
  'Bb': ['Bb', 'C',  'D',  'Eb', 'F',  'G',  'A'],
  'B':  ['B',  'C#', 'D#', 'E',  'F#', 'G#', 'A#'],
};

export const ALL_KEYS = Object.keys(KEY_SCALES);
export const ALL_DEGREES = [1, 2, 3, 4, 5, 6, 7];

// Diatonic chord qualities of the major scale, indexed by degree-1.
export const DIATONIC_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];

export function chordForDegree(key, degree) {
  const root = KEY_SCALES[key][degree - 1];
  const quality = DIATONIC_QUALITIES[degree - 1];
  return formatChord(root, quality);
}

export function formatChord(root, quality) {
  switch (quality) {
    case 'maj': return root;
    case 'min': return root + 'm';
    case 'dim': return root + 'dim';
    default:    return root;
  }
}

// Nashville notation: 1, 2m, 3m, 4, 5, 6m, 7dim
export function formatDegree(degree) {
  const quality = DIATONIC_QUALITIES[degree - 1];
  switch (quality) {
    case 'maj': return String(degree);
    case 'min': return degree + 'm';
    case 'dim': return degree + 'dim';
    default:    return String(degree);
  }
}

export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
