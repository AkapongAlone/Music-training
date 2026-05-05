// NNS Quiz module.
// Each question shows all 7 diatonic choices, optionally with a per-question
// time limit and an audible chord cue.

import {
  ALL_KEYS, ALL_DEGREES, KEY_SCALES, DIATONIC_QUALITIES,
  chordForDegree, formatDegree, randomFrom, shuffle,
} from '../theory.js';
import { AUDIO_STYLES } from '../audio.js';

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

  renderSettings(container, settings, onChange) {
    const update = (patch) => onChange({ ...settings, ...patch });
    const timerOff = settings.secondsPerQuestion === 'off';
    const timerVal = timerOff ? 10 : settings.secondsPerQuestion;

    container.innerHTML = `
      <div class="settings-group">
        <h3>Mode</h3>
        <div class="mode-grid">
          <button class="mode-card ${settings.mode === 'degree-to-chord' ? 'is-active' : ''}" data-mode="degree-to-chord">
            <span class="mode-label">Degree → Chord</span>
            <span class="mode-example">3 of C = <em>Em</em></span>
          </button>
          <button class="mode-card ${settings.mode === 'chord-to-degree' ? 'is-active' : ''}" data-mode="chord-to-degree">
            <span class="mode-label">Chord → Degree</span>
            <span class="mode-example">Em in C = <em>3m</em></span>
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
          <button class="chip ${!settings.playAudio ? 'is-active' : ''}" data-audio-style="off">Off</button>
          ${AUDIO_STYLES.map(s => `
            <button class="chip ${settings.playAudio && settings.audioStyle === s.id ? 'is-active' : ''}" data-audio-style="${s.id}">
              ${s.label}
            </button>
          `).join('')}
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
    `;

    // Mode
    container.querySelectorAll('.mode-card').forEach(btn => {
      btn.addEventListener('click', () => update({ mode: btn.dataset.mode }));
    });

    // Question count
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

    // Timer: number input + Off button
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
          // Toggle back on with last numeric value
          update({ secondsPerQuestion: timerVal });
        } else {
          update({ secondsPerQuestion: 'off' });
        }
      });
    }

    // Audio style
    container.querySelectorAll('[data-audio-style]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.audioStyle;
        if (val === 'off') {
          update({ playAudio: false });
        } else {
          update({ playAudio: true, audioStyle: val });
        }
      });
    });

    // Keys
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

  // chord-to-degree
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
