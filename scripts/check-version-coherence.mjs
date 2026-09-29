#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Every release-version surface is listed here; adding a new one means adding it here too.
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const studioPkg = JSON.parse(read('studio/package.json'));
const version = pkg.version;
const errors = [];
const EXPECTED = {
  nvmrc: '22.22.2',
  // `.npmrc` sets engine-strict=true, so this range is enforced on install. It
  // is deliberately narrower than a bare `>=22`, which admitted 23/24/25 and let
  // a contributor produce a lockfile the CI runner never sees.
  engines: '22.22.x',
  npm: '>=10',
  workflow: '.github/workflows/ci.yml',
  ciNode: '22.22.2',
};

function markerVersion(file) {
  const source = read(file);
  return source.match(/\*\*Version:\*\*\s*`?v?([0-9]+\.[0-9]+\.[0-9]+)[^`\n]*/)?.[1];
}

if (!version) errors.push('package.json missing version');

if (existsSync(path.join(root, 'package-lock.json'))) {
  const lock = JSON.parse(read('package-lock.json'));
  if (lock.version !== version) {
    errors.push(`package-lock.json version ${lock.version} != package.json ${version}`);
  }
  if (lock.packages?.['']?.version !== version) {
    errors.push(`package-lock packages[""].version ${lock.packages?.['']?.version} != ${version}`);
  }
} else if (existsSync(path.join(root, 'pnpm-lock.yaml'))) {
  const pnpmLock = read('pnpm-lock.yaml');
  if (!/^\s{2}\.:\s*$/m.test(pnpmLock)) errors.push('pnpm-lock.yaml missing the root importer');
} else {
  errors.push('missing package-lock.json or pnpm-lock.yaml');
}

// README.md, package.json, and the lockfile root are the release-version surfaces.
for (const file of ['README.md']) {
  const found = markerVersion(file);
  if (!found) errors.push(`${file} missing **Version:** vX.Y.Z marker`);
  else if (found !== version) errors.push(`${file} version ${found} != package.json ${version}`);
}

const nvm = read('.nvmrc').trim();
if (nvm !== EXPECTED.nvmrc) errors.push(`.nvmrc ${nvm} != ${EXPECTED.nvmrc}`);
if (pkg.engines?.node !== EXPECTED.engines) {
  errors.push(`package.json engines.node ${pkg.engines?.node} != ${EXPECTED.engines}`);
}
if (pkg.engines?.npm !== EXPECTED.npm) {
  errors.push(`package.json engines.npm ${pkg.engines?.npm} != ${EXPECTED.npm}`);
}
if (studioPkg.engines?.node !== EXPECTED.engines) {
  errors.push(`studio/package.json engines.node ${studioPkg.engines?.node} != ${EXPECTED.engines}`);
}
if (studioPkg.engines?.npm !== EXPECTED.npm) {
  errors.push(`studio/package.json engines.npm ${studioPkg.engines?.npm} != ${EXPECTED.npm}`);
}
if (pkg.devDependencies?.['eslint-config-next'] !== pkg.dependencies?.next) {
  errors.push('eslint-config-next must exactly match the installed Next.js version');
}

// Every job in the workflow must pin the same runtime, not just the first one —
// the studio typecheck job and the verify job drifting apart is exactly the
// failure this gate exists to catch.
const workflow = read(EXPECTED.workflow);
const nodeVersionFiles = [
  ...workflow.matchAll(/^\s*node-version-file:\s*['"]?([^'"\s]+)['"]?\s*$/gm),
];
const nodeVersions = [...workflow.matchAll(/^\s*node-version:\s*['"]?([^'"\s]+)['"]?\s*$/gm)];

if (nodeVersionFiles.length + nodeVersions.length === 0) {
  errors.push(`${EXPECTED.workflow} pins no Node runtime`);
}
for (const [, file] of nodeVersionFiles) {
  if (file !== '.nvmrc') errors.push(`${EXPECTED.workflow} node-version-file ${file} != .nvmrc`);
}
for (const [, ciNode] of nodeVersions) {
  if (ciNode !== EXPECTED.ciNode) {
    errors.push(`${EXPECTED.workflow} node-version ${ciNode} != ${EXPECTED.ciNode}`);
  }
}

// The studio lives in this repo and ships with it, so it carries the release version too.
if (existsSync(path.join(root, 'studio/package.json'))) {
  const studio = JSON.parse(read('studio/package.json'));
  if (studio.version !== version) {
    errors.push(`studio/package.json version ${studio.version} != package.json ${version}`);
  }
  const studioLock = JSON.parse(read('studio/package-lock.json'));
  if (studioLock.version !== version) {
    errors.push(
      `studio/package-lock.json version ${studioLock.version} != package.json ${version}`,
    );
  }
  if (studioLock.packages?.['']?.version !== version) {
    errors.push(
      `studio/package-lock packages[""].version ${studioLock.packages?.['']?.version} != ${version}`,
    );
  }
}

if (errors.length) {
  console.error('version-coherence FAILED:');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log(`version-coherence OK — ${version}`);
