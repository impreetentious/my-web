#!/usr/bin/env node
/** Build-time content and link validation. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const BLOG = path.join(CONTENT, 'blog');
const FIGURES = new Set(['network', 'bars', 'stack', 'flow', 'orbit', 'pulse']);
const STATUSES = new Set(['live', 'private', 'wip', 'archived']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const errors = [];

function readJson(name) {
  const p = path.join(CONTENT, name);
  if (!fs.existsSync(p)) {
    errors.push(`missing ${name}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (err) {
    errors.push(`${name}: ${err.message}`);
    return null;
  }
}

function isHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isOrigin(value) {
  if (!isHttpUrl(value)) return false;
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash &&
    !/\/$/.test(value)
  );
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function splitFrontmatter(raw, name) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) {
    errors.push(`${name}: missing or malformed frontmatter`);
    return null;
  }
  try {
    const data = parseYaml(match[1]);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      errors.push(`${name}: frontmatter must be a YAML mapping`);
      return null;
    }
    return { data, body: match[2] };
  } catch (err) {
    errors.push(`${name}: invalid YAML frontmatter (${err.message})`);
    return null;
  }
}

const site = readJson('site.json');
if (site) {
  for (const key of [
    'name',
    'heroRoleLine',
    'email',
    'domain',
    'metaTitle',
    'metaDescription',
    'proposition',
    'availability',
    'location',
  ]) {
    if (typeof site[key] !== 'string' || !site[key].trim()) errors.push(`site.${key} missing`);
  }
  if (!site.email || !/.+@.+\..+/.test(site.email)) errors.push('site.email invalid');
  if (!isOrigin(site.domain))
    errors.push('site.domain must be an HTTPS origin without a trailing slash');
  for (const [k, v] of Object.entries(site.socials || {})) {
    if (!isHttpUrl(v)) errors.push(`site.socials.${k} invalid`);
  }
  if (!site.socials?.linkedin || !site.socials?.github) errors.push('site.socials incomplete');
  if (
    typeof site.resumeHref !== 'string' ||
    (!/^\/(?!\/)/.test(site.resumeHref) && !isHttpUrl(site.resumeHref))
  ) {
    errors.push('site.resumeHref invalid');
  }
  if (!Array.isArray(site.keywords)) errors.push('site.keywords must be an array');
  if (typeof site.resumeAvailable !== 'boolean') {
    errors.push('site.resumeAvailable must be boolean');
  }
  const pdf = path.join(ROOT, 'public', 'resume.pdf');
  if (site.resumeAvailable === true) {
    if (!fs.existsSync(pdf)) {
      errors.push('resumeAvailable=true but public/resume.pdf missing');
    } else if (!fs.readFileSync(pdf).subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      errors.push('public/resume.pdf is not a PDF');
    }
  } else if (fs.existsSync(pdf)) {
    errors.push('resumeAvailable=false but public/resume.pdf exists');
  }
}

const about = readJson('about.json');
if (about) {
  if (!Array.isArray(about.bio) || about.bio.length < 1) errors.push('about.bio empty');
  for (const key of ['bioNotes', 'stats', 'skills', 'stack']) {
    if (!Array.isArray(about[key])) errors.push(`about.${key} must be an array`);
  }
}

const portfolio = readJson('portfolio.json');
if (Array.isArray(portfolio)) {
  const ids = new Set();
  for (const item of portfolio) {
    if (!item.id || !item.title || !item.year || !item.description) {
      errors.push(`portfolio item incomplete: ${item.id || '?'}`);
    }
    if (!SLUG.test(item.id || '')) errors.push(`portfolio ${item.id || '?'} id invalid`);
    if (ids.has(item.id)) errors.push(`portfolio id duplicated: ${item.id}`);
    ids.add(item.id);
    if (item.figure && !FIGURES.has(item.figure)) errors.push(`portfolio ${item.id} bad figure`);
    if (item.href && !isHttpUrl(item.href)) errors.push(`portfolio ${item.id} href invalid`);
    if (!Array.isArray(item.tags)) errors.push(`portfolio ${item.id} tags must be an array`);
    if (item.caseStudy) {
      for (const key of ['context', 'decision', 'move', 'model', 'outcome']) {
        if (typeof item.caseStudy[key] !== 'string') {
          errors.push(`portfolio ${item.id} caseStudy.${key} invalid`);
        }
      }
    }
  }
}

const projects = readJson('projects.json');
if (Array.isArray(projects)) {
  const ids = new Set();
  for (const item of projects) {
    if (!item.id || !item.title || !item.description || !STATUSES.has(item.status)) {
      errors.push(`project incomplete: ${item.id || '?'}`);
    }
    if (!SLUG.test(item.id || '')) errors.push(`project ${item.id || '?'} id invalid`);
    if (ids.has(item.id)) errors.push(`project id duplicated: ${item.id}`);
    ids.add(item.id);
    if (item.figure && !FIGURES.has(item.figure)) errors.push(`project ${item.id} bad figure`);
    if (item.href && !isHttpUrl(item.href)) errors.push(`project ${item.id} href invalid`);
    if (!Array.isArray(item.stack)) errors.push(`project ${item.id} stack must be an array`);
    if (item.status === 'live' && !item.href)
      errors.push(`project ${item.id} is live without href`);
    if (item.status === 'private' && item.href)
      errors.push(`project ${item.id} is private with href`);
  }
}

const series = readJson('series.json');
if (!series || typeof series !== 'object' || Object.keys(series).length < 1) {
  errors.push('series.json empty');
} else {
  for (const [key, value] of Object.entries(series)) {
    if (!SLUG.test(key)) errors.push(`series id invalid: ${key}`);
    if (
      !value?.title ||
      !value?.description ||
      !Number.isInteger(value?.planned) ||
      value.planned < 1
    ) {
      errors.push(`series ${key} incomplete`);
    }
  }
}

if (!fs.existsSync(BLOG)) {
  errors.push('content/blog missing');
} else {
  const posts = fs.readdirSync(BLOG).filter((f) => f.endsWith('.mdx'));
  if (posts.length < 1) errors.push('need ≥1 blog post');
  const slugs = new Set();
  const seriesParts = new Set();
  for (const name of posts) {
    const raw = fs.readFileSync(path.join(BLOG, name), 'utf8');
    const parsed = splitFrontmatter(raw, name);
    if (!parsed) continue;
    const { data, body } = parsed;
    const slug = data.slug;
    if (typeof slug !== 'string' || !SLUG.test(slug)) errors.push(`${name}: missing/invalid slug`);
    else {
      if (slugs.has(slug)) errors.push(`${name}: duplicate slug ${slug}`);
      slugs.add(slug);
      if (name !== `${slug}.mdx`) errors.push(`${name}: filename must match slug ${slug}`);
    }
    if (typeof data.title !== 'string' || !data.title.trim()) errors.push(`${name}: missing title`);
    if (typeof data.excerpt !== 'string' || !data.excerpt.trim())
      errors.push(`${name}: missing excerpt`);
    if (!isIsoDate(data.date)) {
      errors.push(`${name}: missing/invalid date`);
    }
    if (!body.trim()) errors.push(`${name}: body is empty`);

    if (data.series !== undefined) {
      if (typeof data.series !== 'string' || !series?.[data.series]) {
        errors.push(`${name}: series "${String(data.series)}" not in series.json`);
      }
      if (!Number.isInteger(data.seriesIndex) || data.seriesIndex < 1) {
        errors.push(`${name}: seriesIndex must be a positive integer`);
      } else if (series?.[data.series] && data.seriesIndex > series[data.series].planned) {
        errors.push(`${name}: seriesIndex exceeds planned series length`);
      } else {
        const part = `${data.series}:${data.seriesIndex}`;
        if (seriesParts.has(part)) errors.push(`${name}: duplicate series part ${part}`);
        seriesParts.add(part);
      }
    } else if (data.seriesIndex !== undefined) {
      errors.push(`${name}: seriesIndex requires series`);
    }

    for (const m of body.matchAll(/\[([^\]]+)\]\((https?:[^)]+)\)/g)) {
      if (!isHttpUrl(m[2])) errors.push(`${name}: bad link ${m[2]}`);
    }
  }
}

if (errors.length) {
  console.error('[validate-content] FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('[validate-content] ok');
