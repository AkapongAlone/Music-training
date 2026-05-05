export default function Home({ modules, onSelect }) {
  const list = Object.values(modules);

  return (
    <>
      <header className="hero">
        <p className="eyebrow">The Practice Room</p>
        <h1 className="display">Music<br /><span className="display-italic">Training</span></h1>
        <p className="hero-sub">Theory and ear practice for working musicians. Pick a module, set your scope, drill until it's automatic.</p>
      </header>

      <section className="section">
        <p className="section-label"><span>I.</span> Modules</p>
        <div className="module-list">
          {list.map((m, i) => (
            <button key={m.id} className="module-card" onClick={() => onSelect(m.id)}>
              <span className="module-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="module-body">
                <span className="module-name">{m.name}</span>
                <span className="module-tag">{m.tagline}</span>
                <span className="module-desc">{m.description}</span>
              </span>
              <span className="module-arrow" aria-hidden="true">→</span>
            </button>
          ))}
          <div className="module-card placeholder" aria-disabled="true">
            <span className="module-num">{String(list.length + 1).padStart(2, '0')}</span>
            <span className="module-body">
              <span className="module-name">Coming soon</span>
              <span className="module-tag">Interval ear training, scale spelling, chord function recognition.</span>
            </span>
          </div>
        </div>
      </section>

      <footer className="page-foot">
        <span>No login. No tracking. Just practice.</span>
      </footer>
    </>
  );
}
