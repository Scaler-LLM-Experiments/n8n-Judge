import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.test.{js,ts}', 'apps/**/*.test.{js,ts}'],
  },
});
