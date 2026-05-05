import {
  ALL_KEYS, ALL_DEGREES, KEY_SCALES, DIATONIC_QUALITIES,
  chordForDegree, formatDegree, randomFrom, shuffle,
} from '../../theory.js';

export const nnsQuizModule = {
  id: 'nns-quiz',
  name: 'NNS Quiz',
  tagline: 'Translate between numbers and chords.',
  description: 'Practice the Nashville Number System. Move fluently between degree numbers and chord names across all twelve keys.',

  defaultSettings() {
    return {
      mode: 'degree-to-chord',
      questionCount: 10,
      keys: [...ALL_KEYS],
      secondsPerQuestion: 10,
      playAudio: true,
      audioStyle: 'synth',
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

  const timeLimit = settings.secondsPerQuestion === 'off' ? null : settings.secondsPerQuestion;
  const audio = settings.playAudio ? { root, quality, style: settings.audioStyle } : null;

  if (settings.mode === 'degree-to-chord') {
    const choices = ALL_DEGREES.map(d => chordForDegree(key, d));
    const correct = chordForDegree(key, degree);
    return {
      id: index,
      meta: { key, degree, mode: settings.mode },
      prompt: { left: formatDegree(degree), right: `of ${key}` },
      choices: shuffle(choices),
      correct,
      timeLimit,
      audio,
    };
  }

  const chord = chordForDegree(key, degree);
  const correct = formatDegree(degree);
  const choices = ALL_DEGREES.map(d => formatDegree(d));
  return {
    id: index,
    meta: { key, degree, mode: settings.mode },
    prompt: { left: chord, right: `in ${key}` },
    choices: shuffle(choices),
    correct,
    timeLimit,
    audio,
  };
}
