import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/index.ts',
        // Pure type declarations — no executable code to cover.
        'src/temporal/types.ts',
        'src/db/**',
      ],
      thresholds: {
        // The schedule resolver is the highest-risk unit in the codebase.
        // It must stay near-fully covered.
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
