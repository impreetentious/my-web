#!/usr/bin/env node
/**
 * G3 — Pull Sanity → content/* at build time.
 * Zero npm dependencies. Unset SANITY_PROJECT_ID → committed fallback, exit 0.
 *
 * Env: SANITY_PROJECT_ID (required to pull)
 *      SANITY_DATASET (optional, default "production")
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const BLOG = path.join(CONTENT, 'blog');
const API_VERSION = '2024-01-01';
const FIGURES = new Set(['network', 'bars', 'stack', 'flow', 'orbit', 'pulse']);
const STATUSES = new Set(['live', 'wip', 'archived']);

/** Load .env / .env.local without a dependency (Next does not inject into prebuild). */
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

function warn(msg) {
  console.warn(`[pull-content] ${msg}`);
}

function ok(msg) {
  console.log(`[pull-content] ${msg}`);
}

if (!projectId) {
  ok('SANITY_PROJECT_ID not set — using committed content');
  process.exit(0);
}

const base = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}`;

async function groq(query) {
  const url = `${base}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GROQ ${res.status} ${res.statusText} for ${query.slice(0, 60)}…`);
  }
  const json = await res.json();
  return json.result;
}

function slugOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.current) return String(value.current);
  return '';
}

function isEmail(s) {
  return typeof s === 'string' && /.+@.+\..+/.test(s);
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeAtomic(filePath, contents) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, contents, 'utf8');
  fs.renameSync(tmp, filePath);
}

function validate(data) {
  const errors = [];
  const { site, about, portfolio, projects, seriesDocs, posts } = data;

  if (!site || typeof site !== 'object') errors.push('site missing');
  else {
    for (const k of [
      'name',
      'heroRoleLine',
      'email',
      'domain',
      'metaTitle',
      'metaDescription',
      'proposition',
      'availability',
      'location',
      'resumeHref',
    ]) {
      if (!site[k]) errors.push(`site.${k} missing`);
    }
    if (site.email && !isEmail(site.email)) errors.push('site.email invalid');
    if (!site.socials?.linkedin || !site.socials?.github) errors.push('site.socials incomplete');
    if (typeof site.resumeAvailable !== 'boolean')
      errors.push('site.resumeAvailable must be boolean');
    if (!Array.isArray(site.keywords)) errors.push('site.keywords must be array');
  }

  if (!about || typeof about !== 'object') errors.push('about missing');
  else {
    for (const k of ['headline', 'tagline', 'bio', 'bioNotes', 'stats', 'skills', 'stack']) {
      if (about[k] == null) errors.push(`about.${k} missing`);
    }
    if (!Array.isArray(about.bio) || about.bio.length < 1) errors.push('about.bio empty');
  }

  if (!Array.isArray(portfolio)) errors.push('portfolio not array');
  else {
    for (const item of portfolio) {
      const id = slugOf(item.id);
      if (!id) errors.push('portfolio item missing id');
      if (!item.title || !item.year || !item.description)
        errors.push(`portfolio ${id || '?'} incomplete`);
      if (item.figure && !FIGURES.has(item.figure)) errors.push(`portfolio ${id} bad figure`);
      if (item.caseStudy) {
        for (const k of ['context', 'decision', 'move', 'model', 'outcome']) {
          if (typeof item.caseStudy[k] !== 'string') errors.push(`portfolio ${id} caseStudy.${k}`);
        }
      }
    }
  }

  if (!Array.isArray(projects)) errors.push('projects not array');
  else {
    for (const item of projects) {
      const id = slugOf(item.id);
      if (!id) errors.push('project item missing id');
      if (!item.title || !item.description || !STATUSES.has(item.status)) {
        errors.push(`project ${id || '?'} incomplete/bad status`);
      }
      if (item.figure && !FIGURES.has(item.figure)) errors.push(`project ${id} bad figure`);
    }
  }

  if (!Array.isArray(seriesDocs) || seriesDocs.length < 1) errors.push('series empty');
  else {
    for (const s of seriesDocs) {
      if (!slugOf(s.key) || !s.title || typeof s.planned !== 'number' || !s.description) {
        errors.push(`series ${slugOf(s.key) || '?'} incomplete`);
      }
    }
  }

  if (!Array.isArray(posts) || posts.length < 1) errors.push('need ≥1 post');
  else {
    for (const p of posts) {
      const slug = slugOf(p.slug);
      if (
        !slug ||
        !p.title ||
        !p.date ||
        !p.excerpt ||
        typeof p.body !== 'string' ||
        !p.body.trim()
      ) {
        errors.push(`post ${slug || '?'} incomplete`);
      }
    }
  }

  return errors;
}

function mapPortfolio(items) {
  return [...items]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => {
      const out = {
        id: slugOf(item.id),
        title: item.title,
        year: item.year,
        description: item.description,
        tags: item.tags || [],
        href: item.href ?? null,
        figure: item.figure || undefined,
        caseStudy: item.caseStudy
          ? {
              context: item.caseStudy.context,
              decision: item.caseStudy.decision,
              move: item.caseStudy.move,
              model: item.caseStudy.model,
              outcome: item.caseStudy.outcome,
            }
          : null,
      };
      if (item.enabled === false) out.enabled = false;
      return out;
    });
}

function mapProjects(items) {
  return [...items]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => {
      const out = {
        id: slugOf(item.id),
        title: item.title,
        description: item.description,
        stack: item.stack || [],
        href: item.href ?? null,
        status: item.status,
        figure: item.figure || undefined,
      };
      if (item.enabled === false) out.enabled = false;
      return out;
    });
}

function mapSeries(docs) {
  const out = {};
  for (const s of docs) {
    out[slugOf(s.key)] = {
      title: s.title,
      planned: s.planned,
      description: s.description,
    };
  }
  return out;
}

function mapSite(site) {
  return {
    name: site.name,
    heroRoleLine: site.heroRoleLine,
    email: site.email,
    socials: {
      linkedin: site.socials.linkedin,
      github: site.socials.github,
    },
    domain: site.domain,
    metaTitle: site.metaTitle,
    metaDescription: site.metaDescription,
    keywords: site.keywords || [],
    proposition: site.proposition,
    availability: site.availability,
    location: site.location,
    resumeHref: site.resumeHref || '/resume.pdf',
    resumeAvailable: Boolean(site.resumeAvailable),
  };
}

function mapAbout(about) {
  return {
    headline: about.headline,
    tagline: about.tagline,
    bio: about.bio,
    bioNotes: about.bioNotes || [],
    pullQuote: about.pullQuote || '',
    pullQuoteRef: about.pullQuoteRef || '',
    currentFocus: about.currentFocus || '',
    stats: (about.stats || []).map((s) => ({ value: s.value, label: s.label })),
    skills: about.skills || [],
    stack: about.stack || [],
  };
}

function renderMdx(post, seriesKey) {
  const lines = [
    '---',
    `title: ${JSON.stringify(post.title)}`,
    `date: ${JSON.stringify(post.date)}`,
    `excerpt: ${JSON.stringify(post.excerpt)}`,
    `slug: ${JSON.stringify(slugOf(post.slug))}`,
  ];
  if (seriesKey) {
    lines.push(`series: ${JSON.stringify(seriesKey)}`);
    if (typeof post.seriesIndex === 'number') {
      lines.push(`seriesIndex: ${post.seriesIndex}`);
    }
  }
  lines.push('---', '', post.body.replace(/^\n+/, '').replace(/\n+$/, ''), '');
  return lines.join('\n');
}

async function downloadResume(site) {
  const asset = site.resume;
  const url = asset?.asset?.url || asset?.url;
  if (!url) return false;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`resume download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(ROOT, 'public', 'resume.pdf');
  const tmp = `${dest}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, dest);
  return true;
}

async function main() {
  ok(`fetching from project ${projectId} / ${dataset}`);

  let site;
  let about;
  let portfolio;
  let projects;
  let seriesDocs;
  let posts;

  try {
    [site, about, portfolio, projects, seriesDocs, posts] = await Promise.all([
      groq('*[_type == "site"][0]{ ..., resume{ asset->{ url } } }'),
      groq('*[_type == "about"][0]'),
      groq('*[_type == "portfolioItem"] | order(order asc)'),
      groq('*[_type == "projectItem"] | order(order asc)'),
      groq('*[_type == "series"]'),
      groq(`*[_type == "post"]|order(date desc){
        title, slug, date, excerpt, body, seriesIndex,
        "seriesKey": series->key.current
      }`),
    ]);
  } catch (err) {
    warn(`fetch failed — keeping committed content. ${err.message}`);
    process.exit(0);
  }

  const errors = validate({ site, about, portfolio, projects, seriesDocs, posts });
  if (errors.length) {
    warn(`validation failed — keeping committed content:\n  - ${errors.join('\n  - ')}`);
    process.exit(0);
  }

  // Validate everything, THEN write everything (atomic per file via rename).
  try {
    writeAtomic(path.join(CONTENT, 'site.json'), stableStringify(mapSite(site)));
    writeAtomic(path.join(CONTENT, 'about.json'), stableStringify(mapAbout(about)));
    writeAtomic(path.join(CONTENT, 'portfolio.json'), stableStringify(mapPortfolio(portfolio)));
    writeAtomic(path.join(CONTENT, 'projects.json'), stableStringify(mapProjects(projects)));
    writeAtomic(path.join(CONTENT, 'series.json'), stableStringify(mapSeries(seriesDocs)));

    fs.mkdirSync(BLOG, { recursive: true });
    const keep = new Set();
    for (const post of posts) {
      const slug = slugOf(post.slug);
      keep.add(`${slug}.mdx`);
      writeAtomic(path.join(BLOG, `${slug}.mdx`), renderMdx(post, post.seriesKey || null));
    }
    for (const name of fs.readdirSync(BLOG)) {
      if (name.endsWith('.mdx') && !keep.has(name)) {
        fs.unlinkSync(path.join(BLOG, name));
        ok(`removed stale post ${name}`);
      }
    }

    const gotResume = await downloadResume(site);
    if (gotResume) ok('wrote public/resume.pdf');

    ok(
      `wrote site/about/portfolio(${portfolio.length})/projects(${projects.length})/series/posts(${posts.length})`,
    );
  } catch (err) {
    warn(`write failed — tree may be partial. ${err.message}`);
    process.exit(0);
  }
}

main();
