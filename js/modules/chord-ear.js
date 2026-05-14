// Chord-by-Ear module.
// A diatonic chord is played; the student identifies it by name or by degree number.
// Audio IS the question — no visual hint beyond the key.

import {
  ALL_KEYS, ALL_DEGREES, KEY_SCALES, DIATONIC_QUALITIES,
  chordForDegree, formatDegree, randomFrom, shuffle,
} from '../theory.js';
import { AUDIO_STYLES } from '../audio.js';

export const chordEarModule = {
  id: 'chord-ear',
  name: 'Chord by Ear',
  tagline: 'Hear it. Name it.',
  description: 'A diatonic chord is played in a chosen key. Listen and identify it — no visual hints. Pure ear training.',

  defaultSettings() {
    return {
      answerMode: 'chord-name', // 'chord-name' | 'degree'
      questionCount: 10,
      keys: ['C'],
      secondsPerQuestion: 'off',
      audioStyle: 'piano',
    };
  },

  renderSettings(container, settings, onChange) {
    const update = (patch) => onChange({ ...settings, ...patch });
    const timerOff = settings.secondsPerQuestion === 'off';
    const timerVal = timerOff ? 10 : settings.secondsPerQuestion;

    container.innerHTML = `
      <div class="settings-group">
        <h3>Answer format</h3>
        <div class="mode-grid">
          <button class="mode-card ${settings.answerMode === 'chord-name' ? 'is-active' : ''}" data-answer-mode="chord-name">
            <span class="mode-label">Chord name</span>
            <span class="mode-example">Em &nbsp;·&nbsp; G &nbsp;·&nbsp; Bdim</span>
          </button>
          <button class="mode-card ${settings.answerMode === 'degree' ? 'is-active' : ''}" data-answer-mode="degree">
            <span class="mode-label">Degree number</span>
            <span class="mode-example">3m &nbsp;·&nbsp; 5 &nbsp;·&nbsp; 7dim</span>
          </button>
        </div>
      </div>

      <div class="settings-group">
        <h3>Questions</h3>
        <div class="chip-row" data-group="count">
          ${[10, 20].map(n => `
            <button class="chip ${settings.questionCount === n && !settings._customCount ? 'is-active' : ''}" data-count="${n}">${n}</button>
          `).join('')}
          <button class="chip ${settings._customCount ? 'is-active' : ''}" data-count="custom">Custom</button>
          <input type="number" class="chip-input ${settings._customCount ? '' : 'is-hidden'}" min="1" max="200" value="${settings.questionCount}" />
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-head">
          <h3>Keys</h3>
          <div class="quick-actions">
            <button class="link-btn" data-keys="all">All</button>
            <button class="link-btn" data-keys="none">None</button>
            <button class="link-btn" data-keys="naturals">Naturals only</button>
          </div>
        </div>
        <div class="chip-grid" data-group="keys">
          ${ALL_KEYS.map(k => `
            <button class="chip ${settings.keys.includes(k) ? 'is-active' : ''}" data-key="${k}">${k}</button>
          `).join('')}
        </div>
      </div>

      <div class="settings-group">
        <h3>Time per question</h3>
        <div class="timer-input-row">
          <input
            type="number"
            class="timer-number-input"
            id="timer-seconds-input"
            min="1"
            max="300"
            value="${timerVal}"
            ${timerOff ? 'disabled' : ''}
            placeholder="วินาที"
          />
          <span class="timer-unit">วิ</span>
          <button class="chip ${timerOff ? 'is-active' : ''}" id="timer-off-btn">Off</button>
        </div>
      </div>

      <div class="settings-group">
        <h3>Sound</h3>
        <div class="chip-row" data-group="audio-style">
          ${AUDIO_STYLES.map(s => `
            <button class="chip ${settings.audioStyle === s.id ? 'is-active' : ''}" data-audio-style="${s.id}">
              ${s.label}
            </button>
          `).join('')}
        </div>
        <p class="settings-hint">Sound is required for ear training.</p>
      </div>
    `;

    container.querySelectorAll('[data-answer-mode]').forEach(btn => {
      btn.addEventListener('click', () => update({ answerMode: btn.dataset.answerMode }));
    });

    container.querySelectorAll('[data-count]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.count;
        if (val === 'custom') {
          update({ _customCount: true });
        } else {
          update({ questionCount: parseInt(val, 10), _customCount: false });
        }
      });
    });
    const customInput = container.querySelector('.chip-input');
    if (customInput) {
      customInput.addEventListener('input', e => {
        const n = Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1));
        update({ questionCount: n, _customCount: true });
      });
    }

    container.querySelectorAll('[data-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        const has = settings.keys.includes(k);
        const next = has ? settings.keys.filter(x => x !== k) : [...settings.keys, k];
        update({ keys: next });
      });
    });
    container.querySelectorAll('[data-keys]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.keys === 'all')      update({ keys: [...ALL_KEYS] });
        if (btn.dataset.keys === 'none')     update({ keys: [] });
        if (btn.dataset.keys === 'naturals') update({ keys: ALL_KEYS.filter(k => k.length === 1) });
      });
    });

    const timerInput = container.querySelector('#timer-seconds-input');
    const timerOffBtn = container.querySelector('#timer-off-btn');
    if (timerInput) {
      timerInput.addEventListener('input', e => {
        const n = Math.max(1, Math.min(300, parseInt(e.target.value, 10) || 1));
        update({ secondsPerQuestion: n });
      });
    }
    if (timerOffBtn) {
      timerOffBtn.addEventListener('click', () => {
        if (settings.secondsPerQuestion === 'off') {
          update({ secondsPerQuestion: timerVal });
        } else {
          update({ secondsPerQuestion: 'off' });
        }
      });
    }

    container.querySelectorAll('[data-audio-style]').forEach(btn => {
      btn.addEventListener('click', () => update({ audioStyle: btn.dataset.audioStyle }));
    });
  },

  validate(settings) {
    const errors = [];
    if (settings.keys.length === 0) errors.push('Pick at least one key.');
    if (!settings.questionCount || settings.questionCount < 1) errors.push('Pick at least one question.');
    return errors;
  },

  generateQuestions(settings) {
    const out = [];
    for (let i = 0; i < settings.questionCount; i++) {
      out.push(buildQuestion(settings, i));
    }
    return out;
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
    // keyAudio plays first (root of the selected key) so the student has tonal context.
    keyAudio: { root: key, quality: 'maj', style: settings.audioStyle },
    audio: { root, quality, style: settings.audioStyle },
  };
}