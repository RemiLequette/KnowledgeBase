import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    env: {
      LOG_LEVEL: 'silent',
    },
  },
});
