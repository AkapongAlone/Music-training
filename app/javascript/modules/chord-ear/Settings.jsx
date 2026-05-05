import { ALL_KEYS } from '../../theory.js';
import { AUDIO_STYLES } from '../../audio.js';

export default function ChordEarSettings({ settings, onChange }) {
  const update = (patch) => onChange({ ...settings, ...patch });
  const timerOff = settings.secondsPerQuestion === 'off';
  const timerVal = timerOff ? 10 : settings.secondsPerQuestion;

  function toggleKey(k) {
    const has = settings.keys.includes(k);
    update({ keys: has ? settings.keys.filter(x => x !== k) : [...settings.keys, k] });
  }

  function setKeys(kind) {
    if (kind === 'all') update({ keys: [...ALL_KEYS] });
    else if (kind === 'none') update({ keys: [] });
    else update({ keys: ALL_KEYS.filter(k => k.length === 1) });
  }

  function setCount(val) {
    if (val === 'custom') {
      update({ _customCount: true });
    } else {
      update({ questionCount: parseInt(val, 10), _customCount: false });
    }
  }

  return (
    <>
      <div className="settings-group">
        <h3>Answer format</h3>
        <div className="mode-grid">
          {[
            { id: 'chord-name', label: 'Chord name', example: 'Em · G · Bdim' },
            { id: 'degree', label: 'Degree number', example: '3m · 5 · 7dim' },
          ].map(m => (
            <button
              key={m.id}
              className={`mode-card ${settings.answerMode === m.id ? 'is-active' : ''}`}
              onClick={() => update({ answerMode: m.id })}
            >
              <span className="mode-label">{m.label}</span>
              <span className="mode-example"><em>{m.example}</em></span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h3>Questions</h3>
        <div className="chip-row">
          {[10, 20].map(n => (
            <button
              key={n}
              className={`chip ${settings.questionCount === n && !settings._customCount ? 'is-active' : ''}`}
              onClick={() => setCount(String(n))}
            >{n}</button>
          ))}
          <button
            className={`chip ${settings._customCount ? 'is-active' : ''}`}
            onClick={() => setCount('custom')}
          >Custom</button>
          {settings._customCount && (
            <input
              type="number"
              className="chip-input"
              min="1"
              max="200"
              value={settings.questionCount}
              onChange={e => {
                const n = Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1));
                update({ questionCount: n, _customCount: true });
              }}
            />
          )}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-head">
          <h3>Keys</h3>
          <div className="quick-actions">
            {['all', 'none', 'naturals'].map(k => (
              <button key={k} className="link-btn" onClick={() => setKeys(k)}>
                {k === 'naturals' ? 'Naturals only' : k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="chip-grid">
          {ALL_KEYS.map(k => (
            <button
              key={k}
              className={`chip ${settings.keys.includes(k) ? 'is-active' : ''}`}
              onClick={() => toggleKey(k)}
            >{k}</button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h3>Time per question</h3>
        <div className="timer-input-row">
          <input
            type="number"
            className="timer-number-input"
            min="1"
            max="300"
            value={timerVal}
            disabled={timerOff}
            placeholder="วินาที"
            onChange={e => {
              const n = Math.max(1, Math.min(300, parseInt(e.target.value, 10) || 1));
              update({ secondsPerQuestion: n });
            }}
          />
          <span className="timer-unit">วิ</span>
          <button
            className={`chip ${timerOff ? 'is-active' : ''}`}
            onClick={() => update({ secondsPerQuestion: timerOff ? timerVal : 'off' })}
          >Off</button>
        </div>
      </div>

      <div className="settings-group">
        <h3>Sound</h3>
        <div className="chip-row">
          {AUDIO_STYLES.map(s => (
            <button
              key={s.id}
              className={`chip ${settings.audioStyle === s.id ? 'is-active' : ''}`}
              onClick={() => update({ audioStyle: s.id })}
            >{s.label}</button>
          ))}
        </div>
        <p className="settings-hint">Sound is required for ear training.</p>
      </div>
    </>
  );
}
