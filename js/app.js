// Main app: screen routing, module registry, generic session & result screens.
// Add new exercise modules by importing them and dropping them into MODULES.

import { nnsQuizModule } from './modules/nns-quiz.js';
import { chordEarModule } from './modules/chord-ear.js';
import { playChord } from './audio.js';

const MODULES = {
  [nnsQuizModule.id]: nnsQuizModule,
  [chordEarModule.id]: chordEarModule,
};

// ---- App state -----------------------------------------------------------

const state = {
  screen: 'home',          // 'home' | 'settings' | 'session' | 'result'
  moduleId: null,
  settings: null,
  questions: [],
  currentIndex: 0,
  answers: [],             // [{ questionId, picked, correct, timedOut? }]
  lastUsedSettings: null,
};

// Per-question timer handles. Cleared on answer / quit / advance.
let timerInterval = null;
let timerDeadline = 0;

const root = document.getElementById('app');

// ---- Render router -------------------------------------------------------

function render() {
  window.scrollTo({ top: 0, behavior: 'instant' });
  root.classList.remove('fade-in');
  void root.offsetWidth;
  root.classList.add('fade-in');

  switch (state.screen) {
    case 'home':     return renderHome();
    case 'settings': return renderSettings();
    case 'session':  return renderSession();
    case 'result':   return renderResult();
  }
}

// ---- Home ----------------------------------------------------------------

function renderHome() {
  const cards = Object.values(MODULES).map((m, i) => `
    <button class="module-card" data-id="${m.id}">
      <span class="module-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="module-body">
        <span class="module-name">${m.name}</span>
        <span class="module-tag">${m.tagline}</span>
        <span class="module-desc">${m.description}</span>
      </span>
      <span class="module-arrow" aria-hidden="true">→</span>
    </button>
  `).join('');

  root.innerHTML = `
    <header class="hero">
      <p class="eyebrow">The Practice Room</p>
      <h1 class="display">Music<br/><span class="display-italic">Training</span></h1>
      <p class="hero-sub">Theory and ear practice for working musicians. Pick a module, set your scope, drill until it's automatic.</p>
    </header>

    <section class="section">
      <p class="section-label"><span>I.</span> Modules</p>
      <div class="module-list">
        ${cards}
        <div class="module-card placeholder" aria-disabled="true">
          <span class="module-num">${String(Object.keys(MODULES).length + 1).padStart(2, '0')}</span>
          <span class="module-body">
            <span class="module-name">Coming soon</span>
            <span class="module-tag">Interval ear training, scale spelling, chord function recognition.</span>
          </span>
        </div>
      </div>
    </section>

    <footer class="page-foot">
      <span>No login. No tracking. Just practice.</span>
    </footer>
  `;

  root.querySelectorAll('.module-card[data-id]').forEach(el => {
    el.addEventListener('click', () => {
      state.moduleId = el.dataset.id;
      state.settings = MODULES[state.moduleId].defaultSettings();
      state.screen = 'settings';
      render();
    });
  });
}

// ---- Settings ------------------------------------------------------------

function renderSettings() {
  const mod = MODULES[state.moduleId];

  root.innerHTML = `
    <header class="page-head">
      <button class="link-btn back-btn" id="back-home">← Back</button>
      <p class="eyebrow">${mod.name}</p>
      <h2 class="page-title">Set your scope</h2>
    </header>

    <section class="settings-body" id="settings-body"></section>

    <div class="settings-actions">
      <p class="settings-error" id="settings-error"></p>
      <button class="primary-btn" id="start-btn">Start session →</button>
    </div>
  `;

  const body = document.getElementById('settings-body');
  const errorEl = document.getElementById('settings-error');

  const onChange = (next) => {
    state.settings = next;
    mod.renderSettings(body, state.settings, onChange);
  };
  mod.renderSettings(body, state.settings, onChange);

  document.getElementById('back-home').addEventListener('click', () => {
    state.screen = 'home';
    render();
  });

  document.getElementById('start-btn').addEventListener('click', () => {
    const errors = (mod.validate ? mod.validate(state.settings) : []);
    if (errors.length > 0) {
      errorEl.textContent = errors.join(' ');
      return;
    }
    errorEl.textContent = '';
    state.questions = mod.generateQuestions(state.settings);
    state.lastUsedSettings = { ...state.settings };
    state.currentIndex = 0;
    state.answers = [];
    state.screen = 'session';
    render();
  });
}

// ---- Session -------------------------------------------------------------

function renderSession() {
  stopTimer();

  const q = state.questions[state.currentIndex];
  const total = state.questions.length;
  const progress = ((state.currentIndex) / total) * 100;
  const answered = state.answers.find(a => a.questionId === q.id);

  const hasTimer = q.timeLimit != null;
  const hasAudio = q.audio != null;

  root.innerHTML = `
    <header class="session-head">
      <button class="link-btn" id="quit-btn">← Quit</button>
      <div class="progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${state.currentIndex + 1} / ${total}</span>
      </div>
    </header>

    ${hasTimer ? `
      <div class="timer">
        <div class="timer-bar"><div class="timer-fill" id="timer-fill" style="width:100%"></div></div>
        <span class="timer-text" id="timer-text">${q.timeLimit}s</span>
      </div>
    ` : ''}

    <section class="prompt">
      <div class="prompt-line">
        <span class="prompt-left">${q.prompt.left}</span>
        <span class="prompt-right">${q.prompt.right}</span>
      </div>
      <div class="prompt-equals">= <span class="prompt-q">?</span></div>
      ${hasAudio ? `
        <button class="audio-btn" id="audio-btn" title="Replay chord" aria-label="Replay chord">
          <span class="audio-icon" aria-hidden="true">♪</span>
          <span>Replay</span>
        </button>
      ` : ''}
    </section>

    <section class="choices choices-7">
      ${q.choices.map(c => `
        <button class="choice" data-value="${escapeAttr(c)}">${c}</button>
      `).join('')}
    </section>

    <div class="session-footer">
      <button class="primary-btn ${answered ? '' : 'is-hidden'}" id="next-btn">
        ${state.currentIndex + 1 === total ? 'See results →' : 'Next →'}
      </button>
    </div>
  `;

  document.getElementById('quit-btn').addEventListener('click', () => {
    if (confirm('Quit this session? Progress will be lost.')) {
      stopTimer();
      state.screen = 'home';
      render();
    }
  });

  root.querySelectorAll('.choice').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn.dataset.value));
  });

  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) nextBtn.addEventListener('click', advance);

  if (hasAudio) {
    const audioBtn = document.getElementById('audio-btn');
    audioBtn.addEventListener('click', () => playChord(q.audio.root, q.audio.quality, q.audio.style));
    if (!answered) playChord(q.audio.root, q.audio.quality, q.audio.style);
  }

  if (answered) {
    paintFeedback(q, answered.picked);
  } else if (hasTimer) {
    startTimer(q.timeLimit);
  }
}

function startTimer(seconds) {
  const fill = document.getElementById('timer-fill');
  const text = document.getElementById('timer-text');
  if (!fill || !text) return;

  const duration = seconds * 1000;
  timerDeadline = performance.now() + duration;

  const tick = () => {
    const remaining = Math.max(0, timerDeadline - performance.now());
    const pct = (remaining / duration) * 100;
    fill.style.width = `${pct}%`;
    text.textContent = `${Math.ceil(remaining / 1000)}s`;
    if (remaining <= 3000) fill.classList.add('is-warning');
    if (remaining <= 0) {
      stopTimer();
      handleTimeout();
    }
  };

  tick();
  timerInterval = setInterval(tick, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleTimeout() {
  const q = state.questions[state.currentIndex];
  if (state.answers.find(a => a.questionId === q.id)) return;
  state.answers.push({ questionId: q.id, picked: null, correct: false, timedOut: true });
  paintFeedback(q, null);
  document.getElementById('next-btn').classList.remove('is-hidden');
}

function handleAnswer(picked) {
  const q = state.questions[state.currentIndex];
  if (state.answers.find(a => a.questionId === q.id)) return;

  stopTimer();
  const correct = picked === q.correct;
  state.answers.push({ questionId: q.id, picked, correct });
  paintFeedback(q, picked);

  document.getElementById('next-btn').classList.remove('is-hidden');
}

function paintFeedback(q, picked) {
  root.querySelectorAll('.choice').forEach(btn => {
    btn.disabled = true;
    const v = btn.dataset.value;
    if (v === q.correct) btn.classList.add('is-correct');
    else if (picked != null && v === picked) btn.classList.add('is-wrong');
    else btn.classList.add('is-faded');
  });
  const text = document.getElementById('timer-text');
  if (text && picked == null) text.textContent = "Time's up";
}

function advance() {
  stopTimer();
  if (state.currentIndex + 1 >= state.questions.length) {
    state.screen = 'result';
  } else {
    state.currentIndex += 1;
  }
  render();
}

document.addEventListener('keydown', (e) => {
  if (state.screen !== 'session') return;
  if (e.key !== 'Enter') return;
  const next = document.getElementById('next-btn');
  if (next && !next.classList.contains('is-hidden')) next.click();
});

// ---- Result --------------------------------------------------------------

function renderResult() {
  const total = state.questions.length;
  const correctCount = state.answers.filter(a => a.correct).length;
  const wrongAnswers = state.answers.filter(a => !a.correct);
  const wrongQuestions = wrongAnswers.map(a => state.questions.find(q => q.id === a.questionId));
  const pct = Math.round((correctCount / total) * 100);

  const scoreLabel =
    pct === 100 ? 'Flawless.' :
    pct >= 90 ? 'Excellent.' :
    pct >= 75 ? 'Solid.' :
    pct >= 50 ? 'Keep going.' :
    'Drill those weak spots.';

  root.innerHTML = `
    <header class="page-head">
      <p class="eyebrow">Session complete</p>
      <h2 class="page-title">${scoreLabel}</h2>
    </header>

    <section class="score-block">
      <div class="score-num">
        <span class="score-correct">${correctCount}</span><span class="score-divider">/</span><span class="score-total">${total}</span>
      </div>
      <div class="score-pct">${pct}%</div>
    </section>

    ${wrongQuestions.length === 0 ? `
      <section class="empty-state">
        <p>No mistakes. Run it again or raise the difficulty.</p>
      </section>
    ` : `
      <section class="section">
        <p class="section-label"><span>·</span> Review</p>
        <ul class="review-list">
          ${wrongQuestions.map((q, i) => {
            const a = wrongAnswers[i];
            const youLabel = a.timedOut ? 'You: —' : `You: ${a.picked}`;
            return `
              <li class="review-item">
                <div class="review-prompt">
                  <span class="review-q">${q.prompt.left} <span class="muted">${q.prompt.right}</span></span>
                </div>
                <div class="review-answers">
                  <span class="review-wrong">${youLabel}${a.timedOut ? ' <span class="muted">(timeout)</span>' : ''}</span>
                  <span class="review-correct">Correct: ${q.correct}</span>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </section>
    `}

    <div class="result-actions">
      ${wrongQuestions.length > 0
        ? `<button class="primary-btn" id="retry-wrong-btn">Retry wrong only (${wrongQuestions.length})</button>`
        : ''}
      <button class="secondary-btn" id="restart-btn">Start over</button>
      <button class="link-btn" id="settings-btn">Change settings</button>
      <button class="link-btn" id="home-btn">Home</button>
    </div>
  `;

  const retryBtn = document.getElementById('retry-wrong-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      state.questions = wrongQuestions.map((q, i) => ({ ...q, id: i }));
      state.currentIndex = 0;
      state.answers = [];
      state.screen = 'session';
      render();
    });
  }

  document.getElementById('restart-btn').addEventListener('click', () => {
    const mod = MODULES[state.moduleId];
    state.questions = mod.generateQuestions(state.lastUsedSettings);
    state.currentIndex = 0;
    state.answers = [];
    state.screen = 'session';
    render();
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    state.screen = 'settings';
    render();
  });

  document.getElementById('home-btn').addEventListener('click', () => {
    state.screen = 'home';
    render();
  });
}

// ---- Helpers -------------------------------------------------------------

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}

// ---- Boot ----------------------------------------------------------------

render();
