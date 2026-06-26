import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

// The env-unset path is what every build without SANITY_PROJECT_ID takes,
// including production deploys of the committed content. Before this test it
// was exercised by a bare invocation with no assertion, so `pull-content.mjs`
// exiting 0 proved nothing about whether it had left `content/` alone.
const root = process.cwd();
const siteJson = join(root, 'content', 'site.json');

describe('pull-content fallback', () => {
  it('exits cleanly and leaves committed content untouched when SANITY_PROJECT_ID is unset', () => {
    const before = { stat: statSync(siteJson), bytes: readFileSync(siteJson) };

    const result = spawnSync(process.execPath, [join(root, 'scripts', 'pull-content.mjs')], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, SANITY_PROJECT_ID: '' },
    });

    assert.equal(result.status, 0, `expected exit 0, got ${result.status}\n${result.stderr}`);
    assert.match(result.stdout, /SANITY_PROJECT_ID not set — using committed content/);

    const after = { stat: statSync(siteJson), bytes: readFileSync(siteJson) };
    assert.equal(
      after.stat.mtimeMs,
      before.stat.mtimeMs,
      'content/site.json was rewritten during the fallback path',
    );
    assert.ok(after.bytes.equals(before.bytes), 'content/site.json bytes changed');
  });
});
