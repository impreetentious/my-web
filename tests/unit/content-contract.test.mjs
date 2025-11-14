import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const contentRoot = join(process.cwd(), 'content');
const figures = new Set(['network', 'bars', 'stack', 'flow', 'orbit', 'pulse']);
const statuses = new Set(['live', 'wip', 'archived']);

function readJson(name) {
  return JSON.parse(readFileSync(join(contentRoot, name), 'utf8'));
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

describe('content contracts', () => {
  it('keeps site identity and social URLs valid', () => {
    const site = readJson('site.json');
    assert.match(site.email, /.+@.+\..+/);
    assert.equal(isHttpUrl(site.domain), true);
    for (const url of Object.values(site.socials)) assert.equal(isHttpUrl(url), true);
  });

  it('keeps project ids unique and render metadata known', () => {
    const projects = readJson('projects.json');
    const ids = new Set(projects.map((project) => project.id));
    assert.equal(ids.size, projects.length);
    for (const project of projects) {
      assert.equal(statuses.has(project.status), true, `${project.id} has unknown status`);
      assert.equal(figures.has(project.figure), true, `${project.id} has unknown figure`);
      if (project.href !== null) assert.equal(isHttpUrl(project.href), true);
    }
  });

  it('keeps blog frontmatter slugs unique and series-backed', () => {
    const series = readJson('series.json');
    const posts = readdirSync(join(contentRoot, 'blog')).filter((name) => name.endsWith('.mdx'));
    const slugs = new Set();

    for (const post of posts) {
      const raw = readFileSync(join(contentRoot, 'blog', post), 'utf8');
      const slug = raw.match(/^slug:\s*["']?([^"'\n]+)/m)?.[1];
      const title = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1];
      const date = raw.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
      const seriesKey = raw.match(/^series:\s*["']?([^"'\n]+)/m)?.[1];

      assert.ok(slug, `${post} missing slug`);
      assert.ok(title, `${post} missing title`);
      assert.ok(date, `${post} missing date`);
      assert.equal(slugs.has(slug), false, `${slug} duplicated`);
      slugs.add(slug);
      if (seriesKey) assert.ok(series[seriesKey], `${post} series ${seriesKey} missing`);
    }
  });
});
