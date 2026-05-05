# Music Training

A practice room for working musicians, in the browser. Drill the Nashville Number System and (eventually) ear training. No login, no backend, no tracking — open the page and practice.

## Modules

- **NNS Quiz** — Translate between degree numbers and chord names across all 12 keys. Two modes:
  - **Degree → Chord** — `3 of C = ?` → `Em`
  - **Chord → Degree** — `Em in C = ?` → `3m`
  - Configurable: number of questions, which keys, which degrees (target weak spots).

More modules planned: interval ear training, scale spelling, chord function recognition.

## Run it

This is plain HTML/CSS/JS using ES modules. Because of how browsers handle `file://` URLs with ES modules, you need to serve it (any static server works):

```bash
# pick whichever you have on hand
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080`.

For deployment, GitHub Pages serves it as-is. Push to `main`, enable Pages → root, done.

## Project structure

```
.
├── index.html
├── styles.css
├── README.md
└── js/
    ├── app.js              # screen routing, module registry, generic Session/Result
    ├── theory.js           # music theory utilities (keys, scales, chord formatting)
    └── modules/
        └── nns-quiz.js     # the NNS Quiz module
```

## Adding a new module

The architecture is module-pluggable. To add e.g. an interval ear-training module:

1. Create `js/modules/your-module.js` exporting an object with this shape:

   ```js
   export const yourModule = {
     id: 'your-module',
     name: 'Your Module',
     tagline: 'Short pitch.',
     description: 'Longer description for the home card.',

     defaultSettings() { return { /* ... */ }; },

     // Mount settings UI into `container`. Call `onChange(newSettings)` on edit.
     renderSettings(container, settings, onChange) { /* ... */ },

     // Optional: return list of error strings; empty = OK.
     validate(settings) { return []; },

     // Return Question[] where each Question is:
     //   { id, prompt: { left, right }, choices: string[], correct: string, meta? }
     generateQuestions(settings) { /* ... */ },
   };
   ```

2. Register it in `js/app.js`:

   ```js
   import { yourModule } from './modules/your-module.js';
   const MODULES = {
     [nnsQuizModule.id]: nnsQuizModule,
     [yourModule.id]: yourModule,
   };
   ```

That's it. The home screen, settings page, session walker, and result screen all work generically.

## Notes on theory

Major-scale diatonic chord qualities (apply to any root):

| Degree | Quality      | Notation |
|--------|--------------|----------|
| 1      | major        | `1`      |
| 2      | minor        | `2m`     |
| 3      | minor        | `3m`     |
| 4      | major        | `4`      |
| 5      | major        | `5`      |
| 6      | minor        | `6m`     |
| 7      | diminished   | `7dim`   |

Keys use conventional spellings: `C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B`. Each key carries its own scale spelling so accidentals stay correct (e.g. `D` major uses `F#` and `C#`, not `Gb` and `Db`).
