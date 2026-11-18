# audio-practice-player

A browser-oriented audio player component designed for music practice. It enhances `<audio>` and `<video>` elements that contain MP3 sources with custom practice controls.

## Features

- Automatically finds `<audio>` and `<video>` elements with MP3 sources (including elements added later via `MutationObserver`)
- Replaces native browser controls with custom practice controls:
  - **Play/Pause** toggle (`▶` / `⏸`) and **Repeat** toggle (`🔃`) on the left
  - **Speed** and **Volume** controls on the right: buttons open vertical sliders in popovers
    - **Speed:** `⏱` with a clear selected-speed display, range `10%`–`200%` in strict `10%` increments
    - **Volume:** `🔊` slider control (`0`–`1`, no mute/unmute toggle)
  - **Full-track progress bar** (scrubbable across the entire duration) with draggable A/B range markers (labels shown in parentheses, no A/B text)
  - **Time display:** current time on the left, `(ending marker)` and total time on the right
- Playback is constrained to the selected A/B range:
  - Play operates within the range
  - When playback reaches the end marker, it **stops** (Repeat off) or **loops back to the start marker** (Repeat on)

## Usage

Build the bundle and include it in your page:

```html
<script type="module" src="./dist/audio-practice-player.js"></script>
```

Or use the IIFE build:

```html
<script src="./dist/audio-practice-player.iife.js"></script>
```

On load, the script scans the document for MP3 `<audio>`/`<video>` elements, removes their native controls, and inserts the custom controls. Dynamically added matching elements are initialized automatically.

### Programmatic API

The ESM entry exports helpers if you want manual control:

```js
import { init, observe, start, initMediaElement } from './src/index.js';

init();      // scan existing media elements
observe();   // watch for newly added media elements
start();     // init + observe
initMediaElement(document.querySelector('audio'));
```

## Demo

A demo page is included in [`docs/`](./docs/) (`index.html`, `sample.mp3`, and the built `audio-practice-player.js` bundle).

1. Install dependencies: `npm install`
2. Ensure an MP3 file named `sample.mp3` is present in `docs/` (or update the media paths in `docs/index.html`)
3. Start the demo: `npm run demo` (builds the bundle with Rollup, then serves `docs/` via [`http-server`](https://www.npmjs.com/package/http-server))
4. Open `http://localhost:8080/` in your browser

To rebuild only the bundle (including `docs/audio-practice-player.js`) without starting the server, run `npm run bundle`. The demo does not load from `src/`; it uses the bundled output in `docs/`.

## Development

- **Language:** Plain JavaScript (no transpilation). Types are documented with JSDoc and checked with TypeScript.
- **Bundler:** [Rollup](https://rollupjs.org/) produces browser-consumable bundles in `dist/`.
- **Testing:** [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) with Playwright (`@web/test-runner-playwright`) runs tests in real browsers.

### Commands

```bash
npm install
npx playwright install chromium
npm run typecheck
npm test
npm run build
```

> Install the Playwright Chromium browser once before running tests (`npx playwright install chromium`). This is required by `@web/test-runner-playwright`.

> `npm run build` runs tests automatically before bundling.

## Project notes

See [`AGENTS.md`](./AGENTS.md) for repository conventions (plain JS + Rollup bundling, JSDoc/TypeScript checking, testing/build expectations, and documentation maintenance).
