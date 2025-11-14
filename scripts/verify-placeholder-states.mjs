#!/usr/bin/env node
/**
 * L6 — both placeholder states must produce a sane parametric world.
 * Flips config/sections.ts placeholder enabled, runs tsc, restores.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SECTIONS = path.join(ROOT, 'config/sections.ts');

const original = fs.readFileSync(SECTIONS, 'utf8');

function withPlaceholder(enabled) {
  const next = original.replace(/(id: 'placeholder',\s*enabled:\s*)(true|false)/, `$1${enabled}`);
  if (next === original && !original.includes(`enabled: ${enabled}`)) {
    // force-write the known line pattern
    const forced = original.replace(
      /id: 'placeholder',\n\s*enabled: (true|false)/,
      `id: 'placeholder',\n    enabled: ${enabled}`,
    );
    fs.writeFileSync(SECTIONS, forced);
  } else {
    fs.writeFileSync(SECTIONS, next);
  }
}

function runTsc(label) {
  console.log(`[placeholder-states] tsc — placeholder ${label}`);
  const r = spawnSync('npx', ['tsc', '--noEmit'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    fs.writeFileSync(SECTIONS, original);
    console.error(r.stdout || '');
    console.error(r.stderr || '');
    console.error(`[placeholder-states] FAILED under placeholder ${label}`);
    process.exit(r.status || 1);
  }
}

try {
  withPlaceholder(false);
  runTsc('disabled (5 cards)');
  withPlaceholder(true);
  runTsc('enabled (6 cards)');
  console.log('[placeholder-states] both states typecheck clean');
} finally {
  fs.writeFileSync(SECTIONS, original);
}
