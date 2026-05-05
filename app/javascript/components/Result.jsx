export default function Result({ questions, answers, onRetryWrong, onRestart, onSettings, onHome }) {
  const total = questions.length;
  const correctCount = answers.filter(a => a.correct).length;
  const pct = Math.round((correctCount / total) * 100);

  const scoreLabel =
    pct === 100 ? 'Flawless.' :
    pct >= 90 ? 'Excellent.' :
    pct >= 75 ? 'Solid.' :
    pct >= 50 ? 'Keep going.' :
    'Drill those weak spots.';

  const wrongAnswers = answers.filter(a => !a.correct);
  const wrongQuestions = wrongAnswers.map(a => questions.find(q => q.id === a.questionId));

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">Session complete</p>
        <h2 className="page-title">{scoreLabel}</h2>
      </header>

      <section className="score-block">
        <div className="score-num">
          <span className="score-correct">{correctCount}</span>
          <span className="score-divider">/</span>
          <span className="score-total">{total}</span>
        </div>
        <div className="score-pct">{pct}%</div>
      </section>

      {wrongQuestions.length === 0 ? (
        <section className="empty-state">
          <p>No mistakes. Run it again or raise the difficulty.</p>
        </section>
      ) : (
        <section className="section">
          <p className="section-label"><span>·</span> Review</p>
          <ul className="review-list">
            {wrongQuestions.map((q, i) => {
              const a = wrongAnswers[i];
              return (
                <li key={q.id} className="review-item">
                  <div className="review-prompt">
                    <span className="review-q">
                      {q.prompt.left} <span className="muted">{q.prompt.right}</span>
                    </span>
                  </div>
                  <div className="review-answers">
                    <span className="review-wrong">
                      {a.timedOut
                        ? <>You: — <span className="muted">(timeout)</span></>
                        : `You: ${a.picked}`}
                    </span>
                    <span className="review-correct">Correct: {q.correct}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="result-actions">
        {wrongQuestions.length > 0 && (
          <button className="primary-btn" onClick={() => onRetryWrong(wrongQuestions)}>
            Retry wrong only ({wrongQuestions.length})
          </button>
        )}
        <button className="secondary-btn" onClick={onRestart}>Start over</button>
        <button className="link-btn" onClick={onSettings}>Change settings</button>
        <button className="link-btn" onClick={onHome}>Home</button>
      </div>
    </>
  );
}
