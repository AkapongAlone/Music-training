// NNS Quiz module.
// To add a new exercise type, create a similar file and register it in app.js.
//
// A module exports an object with this shape:
//   {
//     id, name, tagline, description,
//     defaultSettings(): SettingsObject,
//     renderSettings(container, settings, onChange): void
//       - mounts settings UI into `container`, calls onChange(newSettings) on edits
//     generateQuestions(settings): Question[]
//       - Question = { id, prompt, choices, correct, meta? }
//       - prompt is rendered by the generic Session screen as { left, right }
//   }

import {
  ALL_KEYS, ALL_DEGREES, KEY_SCALES, DIATONIC_QUALITIES,
  chordForDegree, formatChord, formatDegree, randomFrom, shuffle,
} from '../theory.js';

export const nnsQuizModule = {
  id: 'nns-quiz',
  name: 'NNS Quiz',
  tagline: 'Translate between numbers and chords.',
  description: 'Practice the Nashville Number System. Move fluently between degree numbers and chord names across all twelve keys.',

  defaultSettings() {
    return {
      mode: 'degree-to-chord', // or 'chord-to-degree'
      questionCount: 10,
      keys: [...ALL_KEYS],
      degrees: [...ALL_DEGREES],
    };
  },

  renderSettings(container, settings, onChange) {
    const update = (patch) => onChange({ ...settings, ...patch });

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
        <div class="settings-head">
          <h3>Degrees</h3>
          <div class="quick-actions">
            <button class="link-btn" data-degrees="all">All</button>
            <button class="link-btn" data-degrees="none">None</button>
          </div>
        </div>
        <div class="chip-grid" data-group="degrees">
          ${ALL_DEGREES.map(d => `
            <button class="chip ${settings.degrees.includes(d) ? 'is-active' : ''}" data-degree="${d}">${formatDegree(d)}</button>
          `).join('')}
        </div>
      </div>
    `;

    // Mode selection
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

    // Keys: individual + quick actions
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

    // Degrees: individual + quick actions
    container.querySelectorAll('[data-degree]').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseInt(btn.dataset.degree, 10);
        const has = settings.degrees.includes(d);
        const next = has ? settings.degrees.filter(x => x !== d) : [...settings.degrees, d];
        update({ degrees: next });
      });
    });
    container.querySelectorAll('[data-degrees]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.degrees === 'all')  update({ degrees: [...ALL_DEGREES] });
        if (btn.dataset.degrees === 'none') update({ degrees: [] });
      });
    });
  },

  validate(settings) {
    const errors = [];
    if (settings.keys.length === 0) errors.push('Pick at least one key.');
    if (settings.degrees.length === 0) errors.push('Pick at least one degree.');
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
  const degree = randomFrom(settings.degrees);

  if (settings.mode === 'degree-to-chord') {
    const correct = chordForDegree(key, degree);
    const decoys = chordDecoys(key, degree, correct);
    return {
      id: index,
      meta: { key, degree, mode: settings.mode },
      prompt: { left: formatDegree(degree), right: `of ${key}` },
      choices: shuffle([correct, ...decoys]),
      correct,
    };
  }

  // chord-to-degree
  const chord = chordForDegree(key, degree);
  const correct = formatDegree(degree);
  const decoys = degreeDecoys(degree, correct);
  return {
    id: index,
    meta: { key, degree, mode: settings.mode },
    prompt: { left: chord, right: `in ${key}` },
    choices: shuffle([correct, ...decoys]),
    correct,
  };
}

// Decoys for "Degree → Chord": mix of other diatonic chords from the same key
// plus a "wrong quality, same root" trap (e.g. E instead of Em for 3 of C).
function chordDecoys(key, degree, correct) {
  const decoys = new Set();

  const otherDegrees = ALL_DEGREES.filter(d => d !== degree);
  for (const d of shuffle(otherDegrees)) {
    decoys.add(chordForDegree(key, d));
    if (decoys.size >= 2) break;
  }

  const root = KEY_SCALES[key][degree - 1];
  const correctQuality = DIATONIC_QUALITIES[degree - 1];
  const otherQualities = ['maj', 'min', 'dim'].filter(q => q !== correctQuality);
  for (const q of shuffle(otherQualities)) {
    const candidate = formatChord(root, q);
    if (candidate !== correct && !decoys.has(candidate)) {
      decoys.add(candidate);
      break;
    }
  }

  // Fallback: pad with random diatonic chords from any key.
  while (decoys.size < 3) {
    const c = chordForDegree(randomFrom(ALL_KEYS), randomFrom(ALL_DEGREES));
    if (c !== correct) decoys.add(c);
  }

  return [...decoys].slice(0, 3);
}

// Decoys for "Chord → Degree": other formatted degree numbers.
function degreeDecoys(degree, correct) {
  const decoys = new Set();
  for (const d of shuffle(ALL_DEGREES.filter(x => x !== degree))) {
    decoys.add(formatDegree(d));
    if (decoys.size >= 3) break;
  }
  return [...decoys];
}
