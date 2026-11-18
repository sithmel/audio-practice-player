# audio-practice-player

A browser-oriented audio player component designed for music practice. It enhances `<audio>` and `<video>` elements that contain MP3 sources with custom practice controls.

## Features

- Automatically finds `<audio>` and `<video>` elements with MP3 sources (including elements added later via `MutationObserver`)
- Replaces native browser controls with custom controls:
  - **Play** and **Pause**
  - **Full-track progress bar** (scrubbable across the entire duration)
  - **Playback speed** control: default `100%`, range `10%`–`200%`, adjustable in `±10%` steps
  - **A/B range markers** (two movable cursors) defaulting to track start/end, each labeled with `mm:ss`
  - **Repeat** toggle
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

A demo page is included as [`demo.html`](./demo.html).

1. Install dependencies: `npm install`
2. Add an MP3 file named `sample.mp3` to the project root (or update the media `src` paths in `demo.html`)
3. Start the local server: `npm run demo` (uses [`http-server`](https://www.npmjs.com/package/http-server))
4. Open `http://localhost:8080/demo.html` in your browser

The demo loads `src/index.js` directly (no build required) and includes examples for `<audio>`, `<video>` with an MP3 source, and dynamically added elements.

## Development

- **Language:** Plain JavaScript (no transpilation). Types are documented with JSDoc and checked with TypeScript.
- **Bundler:** [Rollup](https://rollupjs.org/) produces browser-consumable bundles in `dist/`.
- **Testing:** [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) with Playwright (`@web/test-runner-playwright`) runs tests in real browsers.

### Commands

```bash
npm install
npm run typecheck
npm test
npm run build
```

> `npm run build` runs tests automatically before bundling.

## Project notes

See [`AGENTS.md`](./AGENTS.md) for repository conventions (plain JS + Rollup bundling, JSDoc/TypeScript checking, testing/build expectations, and documentation maintenance).
