# AGENTS.md

## Project overview

`audio-practice-player` is a browser-oriented audio player component designed for music practice. Source code targets the browser and must be bundled into artifacts that can be downloaded and run directly in a browser.

## Build and runtime model

- **Language:** Plain JavaScript (no source transpilation step).
- **Bundler:** Use [Rollup](https://rollupjs.org/) to bundle source files into browser-consumable output.
- **No transpilation:** Do not introduce Babel/TypeScript emit or other transforms that transpile JavaScript syntax. Rollup is used for bundling/module packaging, not for rewriting the language level of the source.
- Keep build outputs suitable for direct browser use (e.g. ES modules or another browser-ready format as configured by the project).

## Type checking

- Source files are written in JavaScript and use **TypeScript types in JSDoc/docstrings** for static typing.
- **TypeScript is required** for type checking (for example via `tsc` with JavaScript checking enabled such as `allowJs`/`checkJs`), not as a transpilation target.
- When adding or modifying code, maintain accurate JSDoc type annotations and keep type checking passing.

## Testing

- **Recommended runner:** Use [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/) (`@web/test-runner`) to execute tests in real browsers, which is a good fit for browser APIs and audio-related behavior.
- **Browser launcher:** Prefer `@web/test-runner-playwright` for reliable headless runs locally and in CI.
- **Test style:** Write tests as ES modules and avoid requiring transpilation of source code; tests should align with the plain-JS, browser-targeted setup.
- **Build integration:** Configure npm scripts so tests run automatically before building (for example, make the `build` script depend on a successful `test` run, or use a `prebuild` hook).

## Development guidelines

- Prefer small, focused changes consistent with existing project structure and conventions.
- Do not add unnecessary dependencies or build steps; preserve the plain-JS + Rollup bundling + JSDoc typing approach.
- **Documentation:** Project documentation lives in `README.md` and should be kept up to date with code and behavior changes.
- **Testing/build:** Tests should run automatically before building.
- Update documentation (including this file) when build, tooling, or project conventions change.
- Avoid committing generated artifacts unless the repository explicitly tracks them.
