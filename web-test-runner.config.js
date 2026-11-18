import { playwrightLauncher } from '@web/test-runner-playwright';

/** @type {import('@web/test-runner').TestRunnerConfig} */
export default {
  files: 'test/**/*.test.js',
  nodeResolve: true,
  browsers: [playwrightLauncher({ product: 'chromium' })],
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: 10000,
    },
  },
};
