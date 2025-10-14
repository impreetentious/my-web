#!/usr/bin/env node
/**
 * Build-time content + link validation (optional ops idea).
 * Zero deps. Exits non-zero on hard failures so prebuild can gate deploys.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const BLOG = path.join(CONTENT, 'blog');
const FIGURES = new Set(['network', 'bars', 'stack', 'flow', 'orbit', 'pulse']);
const STATUSES = new Set(['live', 'wip', 'archived']);

const errors = [];
const warnings = [];

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

const site = readJson('site.json');
if (site) {
  if (!site.email || !/.+@.+\..+/.test(site.email)) errors.push('site.email invalid');
  if (!site.domain || !isHttpUrl(site.domain)) errors.push('site.domain invalid');
  for (const [k, v] of Object.entries(site.socials || {})) {
    if (!isHttpUrl(v)) errors.push(`site.socials.${k} invalid`);
  }
  if (site.resumeAvailable === true) {
    const pdf = path.join(ROOT, 'public', 'resume.pdf');
    if (!fs.existsSync(pdf)) {
      errors.push('resumeAvailable=true but public/resume.pdf missing');
    }
  }
}

const about = readJson('about.json');
if (about) {
  if (!Array.isArray(about.bio) || about.bio.length < 1) errors.push('about.bio empty');
}

const portfolio = readJson('portfolio.json');
if (Array.isArray(portfolio)) {
  for (const item of portfolio) {
    if (!item.id || !item.title) errors.push(`portfolio item incomplete: ${item.id || '?'}`);
    if (item.figure && !FIGURES.has(item.figure)) errors.push(`portfolio ${item.id} bad figure`);
    if (item.href && !isHttpUrl(item.href)) errors.push(`portfolio ${item.id} href invalid`);
  }
}

const projects = readJson('projects.json');
if (Array.isArray(projects)) {
  for (const item of projects) {
    if (!item.id || !item.title || !STATUSES.has(item.status)) {
      errors.push(`project incomplete: ${item.id || '?'}`);
    }
    if (item.figure && !FIGURES.has(item.figure)) errors.push(`project ${item.id} bad figure`);
    if (item.href && !isHttpUrl(item.href)) errors.push(`project ${item.id} href invalid`);
    if (item.status === 'live' && !item.href) {
      warnings.push(`project ${item.id} is live with null href (PRIVATE by design?)`);
    }
  }
}

const series = readJson('series.json');
if (!series || typeof series !== 'object' || Object.keys(series).length < 1) {
  errors.push('series.json empty');
}

if (!fs.existsSync(BLOG)) {
  errors.push('content/blog missing');
} else {
  const posts = fs.readdirSync(BLOG).filter((f) => f.endsWith('.mdx'));
  if (posts.length < 1) errors.push('need ≥1 blog post');
  for (const name of posts) {
    const raw = fs.readFileSync(path.join(BLOG, name), 'utf8');
    if (!raw.startsWith('---')) errors.push(`${name}: missing frontmatter`);
    const slugMatch = raw.match(/^slug:\s*["']?([^"'\n]+)/m);
    const titleMatch = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    const dateMatch = raw.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    if (!slugMatch) errors.push(`${name}: missing slug`);
    if (!titleMatch) errors.push(`${name}: missing title`);
    if (!dateMatch) errors.push(`${name}: missing/invalid date`);
    const seriesMatch = raw.match(/^series:\s*["']?([^"'\n]+)/m);
    if (seriesMatch && series && !series[seriesMatch[1]]) {
      errors.push(`${name}: series "${seriesMatch[1]}" not in series.json`);
    }
    // Soft-check markdown links that look absolute
    const body = raw.replace(/^---[\s\S]*?---\n/, '');
    for (const m of body.matchAll(/\[([^\]]+)\]\((https?:[^)]+)\)/g)) {
      if (!isHttpUrl(m[2])) errors.push(`${name}: bad link ${m[2]}`);
    }
  }
}

if (warnings.length) {
  console.warn('[validate-content] warnings:');
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (errors.length) {
  console.error('[validate-content] FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('[validate-content] ok');
