#!/usr/bin/env node
/**
 * One-time, idempotent content/* → Sanity seed.
 * Requires SANITY_PROJECT_ID + SANITY_WRITE_TOKEN.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const BLOG = path.join(CONTENT, 'blog');
const API_VERSION = '2024-01-01';
const SANITY_ID = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/;
const DATASET = /^[a-z][a-z0-9_-]{0,63}$/;
const FETCH_TIMEOUT_MS = 20_000;

function loadEnvFiles() {
  for (const name of ['.env', '.env.local']) {
    const file = path.join(ROOT, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}
loadEnvFiles();

const projectId = process.env.SANITY_PROJECT_ID?.trim();
const dataset = (process.env.SANITY_DATASET || 'production').trim();
const token = process.env.SANITY_WRITE_TOKEN?.trim();

function die(msg) {
  console.error(`[seed-sanity] ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`[seed-sanity] ${msg}`);
}

if (!projectId) die('SANITY_PROJECT_ID is required');
if (!SANITY_ID.test(projectId)) die('SANITY_PROJECT_ID has an invalid format');
if (!DATASET.test(dataset)) die('SANITY_DATASET has an invalid format');
if (!token) die('SANITY_WRITE_TOKEN is required (Editor token; never commit it)');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, name), 'utf8'));
}

function parseMdx(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const data = parseYaml(match[1]);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return { data, body: match[2].replace(/^\n+/, '').replace(/\n+$/, '') };
}

function slugField(current) {
  return { _type: 'slug', current };
}

const mutations = [];

// site
const site = readJson('site.json');
mutations.push({
  createOrReplace: {
    _id: 'site',
    _type: 'site',
    name: site.name,
    heroRoleLine: site.heroRoleLine,
    email: site.email,
    socials: site.socials,
    domain: site.domain,
    metaTitle: site.metaTitle,
    metaDescription: site.metaDescription,
    keywords: site.keywords,
    proposition: site.proposition,
    availability: site.availability,
    location: site.location,
    resumeHref: site.resumeHref,
    resumeAvailable: Boolean(site.resumeAvailable),
  },
});

// about
const about = readJson('about.json');
mutations.push({
  createOrReplace: {
    _id: 'about',
    _type: 'about',
    headline: about.headline,
    tagline: about.tagline,
    bio: about.bio,
    bioNotes: about.bioNotes,
    pullQuote: about.pullQuote,
    pullQuoteRef: about.pullQuoteRef,
    currentFocus: about.currentFocus,
    stats: about.stats.map((s, i) => ({
      _type: 'object',
      _key: `stat-${i}`,
      value: s.value,
      label: s.label,
    })),
    skills: about.skills,
    stack: about.stack,
  },
});

// portfolio
const portfolio = readJson('portfolio.json');
portfolio.forEach((item, order) => {
  const doc = {
    _id: `portfolio-${item.id}`,
    _type: 'portfolioItem',
    id: slugField(item.id),
    enabled: item.enabled !== false,
    order,
    title: item.title,
    year: item.year,
    description: item.description,
    tags: item.tags || [],
    href: item.href || undefined,
    figure: item.figure || undefined,
  };
  if (item.caseStudy) {
    doc.caseStudy = {
      _type: 'object',
      context: item.caseStudy.context,
      decision: item.caseStudy.decision,
      move: item.caseStudy.move,
      model: item.caseStudy.model,
      outcome: item.caseStudy.outcome,
    };
  }
  mutations.push({ createOrReplace: doc });
});

// projects
const projects = readJson('projects.json');
projects.forEach((item, order) => {
  mutations.push({
    createOrReplace: {
      _id: `project-${item.id}`,
      _type: 'projectItem',
      id: slugField(item.id),
      enabled: item.enabled !== false,
      order,
      title: item.title,
      description: item.description,
      stack: item.stack || [],
      href: item.href || undefined,
      status: item.status,
      figure: item.figure || undefined,
    },
  });
});

// series
const seriesMap = readJson('series.json');
for (const [key, s] of Object.entries(seriesMap)) {
  mutations.push({
    createOrReplace: {
      _id: `series-${key}`,
      _type: 'series',
      key: slugField(key),
      title: s.title,
      planned: s.planned,
      description: s.description,
    },
  });
}

// posts
for (const name of fs.readdirSync(BLOG).filter((f) => f.endsWith('.mdx'))) {
  const parsed = parseMdx(fs.readFileSync(path.join(BLOG, name), 'utf8'));
  if (!parsed) die(`could not parse ${name}`);
  const { data, body } = parsed;
  const slug = data.slug || name.replace(/\.mdx$/, '');
  const doc = {
    _id: `post-${slug}`,
    _type: 'post',
    title: data.title,
    slug: slugField(slug),
    date: data.date,
    excerpt: data.excerpt,
    body,
  };
  if (data.series) {
    doc.series = { _type: 'reference', _ref: `series-${data.series}` };
  }
  if (typeof data.seriesIndex === 'number') {
    doc.seriesIndex = data.seriesIndex;
  }
  mutations.push({ createOrReplace: doc });
}

const url = `https://${projectId}.api.sanity.io/v${API_VERSION}/data/mutate/${dataset}`;

ok(`posting ${mutations.length} mutations to ${projectId}/${dataset}`);

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ mutations }),
  signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
});

if (!res.ok) {
  die(`mutate failed (${res.status} ${res.statusText})`);
}

ok('seed complete');
