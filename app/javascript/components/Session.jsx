import { useState, useEffect, useRef, useCallback } from 'react';
import { playChord } from '../audio.js';

export default function Session({ questions, onQuit, onFinish }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  const q = questions[index];
  const answered = answers.find(a => a.questionId === q.id);
  const total = questions.length;

  function handleAnswer(picked) {
    if (answered) return;
    const correct = picked === q.correct;
    setAnswers(prev => [...prev, { questionId: q.id, picked, correct }]);
  }

  function handleTimeout() {
    if (answered) return;
    setAnswers(prev => [...prev, { questionId: q.id, picked: null, correct: false, timedOut: true }]);
  }

  function advance() {
    if (index + 1 >= total) {
      onFinish(answers.concat(answered ? [] : []));
    } else {
      setIndex(i => i + 1);
    }
  }

  function handleFinish() {
    onFinish(answers);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter' && answered) {
        if (index + 1 >= total) handleFinish();
        else advance();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, index, total, answers]);

  const progress = (index / total) * 100;
  const isLast = index + 1 === total;

  return (
    <>
      <header className="session-head">
        <button className="link-btn" onClick={() => {
          if (window.confirm('Quit this session? Progress will be lost.')) onQuit();
        }}>← Quit</button>
        <div className="progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{index + 1} / {total}</span>
        </div>
      </header>

      {q.timeLimit != null && (
        <TimerBar
          key={`${q.id}-${answered ? 'done' : 'running'}`}
          seconds={q.timeLimit}
          paused={!!answered}
          onTimeout={handleTimeout}
        />
      )}

      <section className="prompt">
        <div className="prompt-line">
          <span className="prompt-left">{q.prompt.left}</span>
          <span className="prompt-right">{q.prompt.right}</span>
        </div>
        <div className="prompt-equals">= <span className="prompt-q">?</span></div>
        {q.audio && (
          <AudioButton audio={q.audio} autoPlay={!answered} />
        )}
      </section>

      <section className="choices choices-7">
        {q.choices.map(c => {
          let cls = 'choice';
          if (answered) {
            if (c === q.correct) cls += ' is-correct';
            else if (answered.picked != null && c === answered.picked) cls += ' is-wrong';
            else cls += ' is-faded';
          }
          return (
            <button
              key={c}
              className={cls}
              disabled={!!answered}
              onClick={() => handleAnswer(c)}
            >{c}</button>
          );
        })}
      </section>

      <div className="session-footer">
        {answered && (
          <button className="primary-btn" onClick={isLast ? handleFinish : advance}>
            {isLast ? 'See results →' : 'Next →'}
          </button>
        )}
      </div>
    </>
  );
}

function TimerBar({ seconds, paused, onTimeout }) {
  const [remaining, setRemaining] = useState(seconds * 1000);
  const deadline = useRef(performance.now() + seconds * 1000);
  const rafRef = useRef(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    function tick() {
      const left = Math.max(0, deadline.current - performance.now());
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeout();
        return;
      }
      if (left > 0) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [paused]);

  const pct = (remaining / (seconds * 1000)) * 100;
  const secs = Math.ceil(remaining / 1000);
  const warning = remaining <= 3000 && remaining > 0;

  return (
    <div className="timer">
      <div className="timer-bar">
        <div className={`timer-fill${warning ? ' is-warning' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="timer-text">{paused && remaining <= 0 ? "Time's up" : `${secs}s`}</span>
    </div>
  );
}

function AudioButton({ audio, autoPlay }) {
  const playedRef = useRef(false);

  useEffect(() => {
    if (autoPlay && !playedRef.current) {
      playedRef.current = true;
      playChord(audio.root, audio.quality, audio.style);
    }
  }, []);

  return (
    <button
      className="audio-btn"
      title="Replay chord"
      aria-label="Replay chord"
      onClick={() => playChord(audio.root, audio.quality, audio.style)}
    >
      <span className="audio-icon" aria-hidden="true">♪</span>
      <span>Replay</span>
    </button>
  );
}
