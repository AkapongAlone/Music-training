# Music Training

A practice room for working musicians, in the browser. No login, no backend, no tracking — open the page and practice.

## Modules

### NNS Quiz
Translate between degree numbers and chord names across all 12 keys.

- **Degree → Chord** — `3 of C = ?` → `Em`
- **Chord → Degree** — `Em in C = ?` → `3m`

Settings: mode, number of questions, keys, time per question, sound style.

Each question shows all 7 diatonic choices (one correct, six distractors). A chord is played automatically when the question appears; replay anytime. If a timer is set and expires, the question is marked wrong and the correct answer is revealed.

### Chord by Ear
Ear training: a diatonic chord is played in a selected key — identify it with no visual hints.

- **Answer format: Chord name** — pick from `C · Dm · Em · F · G · Am · Bdim`
- **Answer format: Degree number** — pick from `1 · 2m · 3m · 4 · 5 · 6m · 7dim`

Settings: answer format, number of questions, keys, time per question, sound style.

## Sound styles

All audio is synthesized in the browser via Web Audio API — no audio files to download.

| Style | Character |
|-------|-----------|
| Synth | Triangle wave, warm and neutral |
| Piano | Sine + harmonics, natural decay |
| Guitar | Sawtooth + lowpass filter, strummed |
| Organ | Drawbar-style harmonics, sustained |
| Bell  | Inharmonic partials, long decay |

## Run locally

Plain HTML/CSS/JS using ES modules. Needs a static server (browsers block ES module imports over `file://`):

```bash
python3 -m http.server 5173
# or
npx serve .
```

Then open `http://localhost:5173`.

## Deploy to Vercel

`vercel.json` is included. Just run:

```bash
npx vercel
```

No build step — Vercel serves the static files directly.

## Project structure

```
.
├── index.html
├── styles.css
├── vercel.json
├── package.json
├── README.md
└── js/
    ├── app.js          # screen routing, module registry, generic Session/Result/Timer
    ├── theory.js       # music theory utilities (keys, scales, chord formatting)
    ├── audio.js        # Web Audio API synth — playChord(root, quality, style)
    └── modules/
        ├── nns-quiz.js # NNS Quiz module
        └── chord-ear.js# Chord by Ear module
```

## Adding a new module

The architecture is module-pluggable. Import and drop into `MODULES` in `js/app.js`.

```js
export const yourModule = {
  id: 'your-module',
  name: 'Your Module',
  tagline: 'Short pitch.',
  description: 'Longer description shown on the home card.',

  defaultSettings() { return { /* ... */ }; },

  // Mount settings UI into `container`. Call `onChange(newSettings)` on edit.
  renderSettings(container, settings, onChange) { /* ... */ },

  // Optional: return error strings; empty array = OK to start.
  validate(settings) { return []; },

  // Return Question[]:
  //   {
  //     id: number,
  //     prompt: { left: string, right: string },
  //     choices: string[],   // shown as buttons; all options
  //     correct: string,     // must match one choice exactly
  //     timeLimit: number | null,  // seconds; null = no timer
  //     audio: { root, quality, style } | null,  // played on question show
  //   }
  generateQuestions(settings) { /* ... */ },
};
```

Register in `js/app.js`:

```js
import { yourModule } from './modules/your-module.js';
const MODULES = {
  [nnsQuizModule.id]: nnsQuizModule,
  [chordEarModule.id]: chordEarModule,
  [yourModule.id]: yourModule,
};
```

The home screen, settings page, session walker (with timer + audio), and result screen all work generically.

## Music theory reference

Major-scale diatonic chord qualities:

| Degree | Quality    | NNS notation |
|--------|------------|--------------|
| 1      | major      | `1`          |
| 2      | minor      | `2m`         |
| 3      | minor      | `3m`         |
| 4      | major      | `4`          |
| 5      | major      | `5`          |
| 6      | minor      | `6m`         |
| 7      | diminished | `7dim`       |

Keys use conventional spellings: `C Db D Eb E F F# G Ab A Bb B`. Each key carries its full scale so accidentals stay correct (e.g. D major uses `F#`/`C#`, not `Gb`/`Db`).
