import { useState } from 'react';

export default function Settings({ mod, SettingsComponent, initialSettings, onBack, onStart }) {
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState('');

  function handleStart() {
    const errors = mod.validate ? mod.validate(settings) : [];
    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }
    setError('');
    onStart(settings);
  }

  return (
    <>
      <header className="page-head">
        <button className="link-btn back-btn" onClick={onBack}>← Back</button>
        <p className="eyebrow">{mod.name}</p>
        <h2 className="page-title">Set your scope</h2>
      </header>

      <section className="settings-body">
        <SettingsComponent settings={settings} onChange={setSettings} />
      </section>

      <div className="settings-actions">
        {error && <p className="settings-error">{error}</p>}
        <button className="primary-btn" onClick={handleStart}>Start session →</button>
      </div>
    </>
  );
}
