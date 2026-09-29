import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Flat config. Generated and build output are ignored here rather than in .eslintignore,
// which flat config no longer reads.
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'studio/**',
      'studio/dist/**',
      'studio/.sanity/**',
      'next-env.d.ts',
    ],
  },
];

export default eslintConfig;
