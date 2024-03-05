import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/test/**/*.test.js'],
    environmentMatchGlobs: [['packages/**/test/**/*.client.test.js', 'jsdom']],
  },
});
