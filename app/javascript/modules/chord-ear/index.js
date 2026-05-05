import {
  ALL_KEYS, ALL_DEGREES, KEY_SCALES, DIATONIC_QUALITIES,
  chordForDegree, formatDegree, randomFrom, shuffle,
} from '../../theory.js';

export const chordEarModule = {
  id: 'chord-ear',
  name: 'Chord by Ear',
  tagline: 'Hear it. Name it.',
  description: 'A diatonic chord is played in a chosen key. Listen and identify it — no visual hints. Pure ear training.',

  defaultSettings() {
    return {
      answerMode: 'chord-name',
      questionCount: 10,
      keys: ['C'],
      secondsPerQuestion: 'off',
      audioStyle: 'piano',
    };
  },

  validate(settings) {
    const errors = [];
    if (settings.keys.length === 0) errors.push('Pick at least one key.');
    if (!settings.questionCount || settings.questionCount < 1) errors.push('Pick at least one question.');
    return errors;
  },

  generateQuestions(settings) {
    return Array.from({ length: settings.questionCount }, (_, i) => buildQuestion(settings, i));
  },
};

function buildQuestion(settings, index) {
  const key = randomFrom(settings.keys);
  const degree = randomFrom(ALL_DEGREES);
  const root = KEY_SCALES[key][degree - 1];
  const quality = DIATONIC_QUALITIES[degree - 1];

  const byDegree = settings.answerMode === 'degree';
  const correct = byDegree ? formatDegree(degree) : chordForDegree(key, degree);
  const choices = shuffle(ALL_DEGREES.map(d => byDegree ? formatDegree(d) : chordForDegree(key, d)));
  const timeLimit = settings.secondsPerQuestion === 'off' ? null : settings.secondsPerQuestion;

  return {
    id: index,
    meta: { key, degree },
    prompt: { left: '♪', right: `in ${key}` },
    choices,
    correct,
    timeLimit,
    audio: { root, quality, style: settings.audioStyle },
  };
}
