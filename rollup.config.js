/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/audio-practice-player.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/audio-practice-player.iife.js',
      format: 'iife',
      name: 'AudioPracticePlayer',
      sourcemap: true,
    },
    {
      file: 'docs/audio-practice-player.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
};
