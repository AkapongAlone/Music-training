import { useState, useEffect } from 'react';
import Home from './components/Home.jsx';
import Settings from './components/Settings.jsx';
import Session from './components/Session.jsx';
import Result from './components/Result.jsx';

import { nnsQuizModule } from './modules/nns-quiz/index.js';
import NNSQuizSettings from './modules/nns-quiz/Settings.jsx';
import { chordEarModule } from './modules/chord-ear/index.js';
import ChordEarSettings from './modules/chord-ear/Settings.jsx';

const MODULES = {
  [nnsQuizModule.id]: nnsQuizModule,
  [chordEarModule.id]: chordEarModule,
};

const SETTINGS_COMPONENTS = {
  [nnsQuizModule.id]: NNSQuizSettings,
  [chordEarModule.id]: ChordEarSettings,
};

export default function App() {
  const [screen, setScreen] = useState('home');
  const [moduleId, setModuleId] = useState(null);
  const [settings, setSettings] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [lastSettings, setLastSettings] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  function selectModule(id) {
    setModuleId(id);
    setSettings(MODULES[id].defaultSettings());
    setScreen('settings');
  }

  function startSession(s) {
    const mod = MODULES[moduleId];
    setLastSettings({ ...s });
    setQuestions(mod.generateQuestions(s));
    setSettings(s);
    setAnswers([]);
    setScreen('session');
  }

  function finishSession(finalAnswers) {
    setAnswers(finalAnswers);
    setScreen('result');
  }

  function retryWrong(wrongQuestions) {
    setQuestions(wrongQuestions.map((q, i) => ({ ...q, id: i })));
    setAnswers([]);
    setScreen('session');
  }

  function restart() {
    const mod = MODULES[moduleId];
    setQuestions(mod.generateQuestions(lastSettings));
    setAnswers([]);
    setScreen('session');
  }

  const mod = moduleId ? MODULES[moduleId] : null;
  const SettingsComp = moduleId ? SETTINGS_COMPONENTS[moduleId] : null;

  return (
    <div className="page fade-in">
      <main id="app-inner">
        {screen === 'home' && (
          <Home modules={MODULES} onSelect={selectModule} />
        )}

        {screen === 'settings' && mod && (
          <Settings
            mod={mod}
            SettingsComponent={SettingsComp}
            initialSettings={settings}
            onBack={() => setScreen('home')}
            onStart={startSession}
          />
        )}

        {screen === 'session' && questions.length > 0 && (
          <Session
            key={questions.map(q => q.id).join('-')}
            questions={questions}
            onQuit={() => setScreen('home')}
            onFinish={finishSession}
          />
        )}

        {screen === 'result' && (
          <Result
            questions={questions}
            answers={answers}
            onRetryWrong={retryWrong}
            onRestart={restart}
            onSettings={() => setScreen('settings')}
            onHome={() => setScreen('home')}
          />
        )}
      </main>
    </div>
  );
}
