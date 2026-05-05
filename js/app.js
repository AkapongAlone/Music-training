// Main app: screen routing, module registry, generic session & result screens.
// Add new exercise modules by importing them and dropping them into MODULES.

import { nnsQuizModule } from './modules/nns-quiz.js';

const MODULES = {
  [nnsQuizModule.id]: nnsQuizModule,
};

// ---- App state -----------------------------------------------------------

const state = {
  screen: 'home',          // 'home' | 'settings' | 'session' | 'result'
  moduleId: null,
  settings: null,
  questions: [],
  currentIndex: 0,
  answers: [],             // [{ questionId, picked, correct }]
  // Settings used to build current questions, kept so "Start over" can rerun.
  lastUsedSettings: null,
};

const root = document.getElementById('app');

// ---- Render router -------------------------------------------------------

function render() {
  window.scrollTo({ top: 0, behavior: 'instant' });
  root.classList.remove('fade-in');
  void root.offsetWidth; // restart css animation
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
// Generic across all modules: takes Question[] and walks through them.

function renderSession() {
  const q = state.questions[state.currentIndex];
  const total = state.questions.length;
  const progress = ((state.currentIndex) / total) * 100;
  const answered = state.answers.find(a => a.questionId === q.id);

  root.innerHTML = `
    <header class="session-head">
      <button class="link-btn" id="quit-btn">← Quit</button>
      <div class="progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${state.currentIndex + 1} / ${total}</span>
      </div>
    </header>

    <section class="prompt">
      <div class="prompt-line">
        <span class="prompt-left">${q.prompt.left}</span>
        <span class="prompt-right">${q.prompt.right}</span>
      </div>
      <div class="prompt-equals">= <span class="prompt-q">?</span></div>
    </section>

    <section class="choices">
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
      state.screen = 'home';
      render();
    }
  });

  root.querySelectorAll('.choice').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(btn.dataset.value));
  });

  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', advance);
  }

  // If already answered (rare — re-renders), reflect feedback.
  if (answered) paintFeedback(q, answered.picked);
}

function handleAnswer(picked) {
  const q = state.questions[state.currentIndex];
  if (state.answers.find(a => a.questionId === q.id)) return; // already answered

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
    else if (v === picked) btn.classList.add('is-wrong');
    else btn.classList.add('is-faded');
  });
}

function advance() {
  if (state.currentIndex + 1 >= state.questions.length) {
    state.screen = 'result';
  } else {
    state.currentIndex += 1;
  }
  render();
}

// Allow Enter to advance after an answer.
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
            return `
              <li class="review-item">
                <div class="review-prompt">
                  <span class="review-q">${q.prompt.left} <span class="muted">${q.prompt.right}</span></span>
                </div>
                <div class="review-answers">
                  <span class="review-wrong">You: ${a.picked}</span>
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
      // Re-run the session with only the questions we got wrong.
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
