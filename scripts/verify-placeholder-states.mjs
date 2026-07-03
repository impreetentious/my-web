#!/usr/bin/env node
/**
 * both placeholder states must produce a sane parametric world.
 *
 * The toggle is driven by NEXT_PUBLIC_MW_FORCE_PLACEHOLDER (read in
 * config/sections.ts), so this script never writes to tracked source: an
 * interrupted run leaves the working tree clean. The NEXT_PUBLIC_ prefix is
 * required — config/sections.ts is reachable from a client component, and
 * anything else would leave the browser bundle on the unforced value and make
 * this gate measure a server tree the client never agrees with.
 *
 * Each state is both typechecked and BUILT — a geometry regression that
 * typechecks (a CROSS_T past the 0.88 clamp in lib/descent.ts, a card
 * overlapping the waterline) only surfaces at build time.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const NEXT_DIR = path.join(ROOT, '.next');

function run(label, command, args, env) {
  console.log(`[placeholder-states] ${command} ${args.join(' ')} — placeholder ${label}`);
  const r = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) {
    console.error(r.stdout || '');
    console.error(r.stderr || '');
    console.error(`[placeholder-states] FAILED under placeholder ${label}`);
    process.exit(r.status || 1);
  }
}

function verify(label, enabled) {
  // Two consecutive builds share `.next`; clearing it stops the second from
  // reading the first's route manifests.
  fs.rmSync(NEXT_DIR, { recursive: true, force: true });

  const env = { NEXT_PUBLIC_MW_FORCE_PLACEHOLDER: String(enabled) };
  run(label, 'npx', ['tsc', '--noEmit'], env);
  // SANITY_PROJECT_ID='' keeps `prebuild` on the committed content.
  run(label, 'npm', ['run', 'build'], { ...env, SANITY_PROJECT_ID: '' });
}

verify('disabled (5 cards)', false);
verify('enabled (6 cards)', true);

console.log('[placeholder-states] both states typecheck and build clean');
