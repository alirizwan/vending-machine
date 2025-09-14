import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/tests/setup.ts'],
    api: {
      port: 0
    },
    hookTimeout: 30000,
  },
});
