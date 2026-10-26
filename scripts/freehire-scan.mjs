#!/usr/bin/env node
/**
 * freehire-scan.mjs — find fresh jobs on freehire.me where AI is part of the work,
 * score them against Hussain's profile, and queue the best ones for career-ops.
 *
 * Reads:   agent.config.json, profile/data/{scan-history.tsv,applications.md,pipeline.md}
 * Writes:  <career-ops>/batch/batch-input.tsv     (offers for batch-runner.sh, appended)
 *          profile/data/scan-history.tsv + pipeline.md (via career-ops' own helpers)
 *          profile/data/freehire-last-scan.md       (human-readable shortlist)
 *
 * Usage:   node scripts/freehire-scan.mjs [--limit N] [--days N] [--dry-run]
 * Env:     CAREER_OPS_DIR (career-ops checkout, default .career-ops)
 *          CAREER_OPS_ROOT (data root, default ./profile)
 *
 * No API key needed: freehire's public API is keyless. No LLM tokens are spent here.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CFG = JSON.parse(readFileSync(path.join(REPO, 'agent.config.json'), 'utf8'));
const CO_DIR = path.resolve(REPO, process.env.CAREER_OPS_DIR || '.career-ops');
const DATA_ROOT = path.resolve(REPO, process.env.CAREER_OPS_ROOT || 'profile');
process.env.CAREER_OPS_ROOT = DATA_ROOT;

const API = 'https://freehire.me/api/v1/agent/jobs/search';
// ATS boards career-ops can verify through public APIs: link to them directly.
// Everything else (Naukri, LinkedIn mirrors, aggregators, JS-heavy boards) goes
// through freehire's server-rendered job page, which a plain fetch can read.
const DIRECT_SOURCES = new Set(['greenhouse', 'lever', 'ashby', 'workable', 'smartrecruiters', 'recruitee']);

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const DRY = args.includes('--dry-run');
const LIMIT = Number(flag('--limit', CFG.jobs_per_run ?? 5));
const S = CFG.scoring;

// ---------------------------------------------------------------- dedup ----
function urlKey(u) {
  try {
    const x = new URL(String(u).trim());
    for (const k of [...x.searchParams.keys()]) if (/^utm_|^ref$|^src$|^xpse$|^xfps$|^xkcb$/i.test(k)) x.searchParams.delete(k);
    return (x.host.toLowerCase().replace(/\.$/, '') + x.pathname.replace(/\/$/, '') + (x.search || '')).toLowerCase();
  } catch { return String(u).trim().toLowerCase(); }
}
function knownUrls() {
  const seen = new Set();
  const files = ['data/scan-history.tsv', 'data/applications.md', 'data/pipeline.md', 'data/freehire-seen.tsv'];
  for (const f of files) {
    const p = path.join(DATA_ROOT, f);
    if (!existsSync(p)) continue;
    for (const m of readFileSync(p, 'utf8').matchAll(/https?:\/\/[^\s|)\]>"']+/g)) seen.add(urlKey(m[0]));
  }
  return seen;
}

// ---------------------------------------------------------------- fetch ----
async function search(params) {
  const qs = new URLSearchParams({ ...CFG.freehire.common_params, ...params });
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`${API}?${qs}`, { headers: { 'User-Agent': 'career-agent (github.com/huss2003)' } });
    if (r.status === 429) {
      const wait = Number(r.headers.get('retry-after') || 10);
      await new Promise(res => setTimeout(res, Math.min(wait, 60) * 1000));
      continue;
    }
    if (!r.ok) throw new Error(`freehire ${r.status} for ${qs}`);
    const j = await r.json();
    if (j.meta?.ignored_params?.length) console.warn(`  ⚠ freehire ignored params: ${JSON.stringify(j.meta.ignored_params)}`);
    return j.data || [];
  }
  return [];
}

// ------------------------------------------------------------ location ----
// Hard rule: no relocation. Pune (any work mode) or remote open to India-based people. Nothing else.
const FOREIGN_ONLY = /\b(us|u\.s\.|usa|united states|eu|europe|uk|canada|latam)[- ](only|based only|residents only)\b|must (be|reside|live)( located| based)? in the (us|u\.s\.|usa|united states|uk|eu|european union)\b|(authori[sz]ed|eligible) to work in the (us|u\.s\.|united states|uk|eu)\b|\b(w-?2|us citizens? only|green card)\b/i;
export function locationFit(job) {
  const loc = String(job.location || '').toLowerCase();
  const cities = (job.cities || []).map(x => String(x).toLowerCase());
  const pune = loc.includes('pune') || cities.includes('pune') || (job.metros || []).some(m => /pune/i.test(m));
  if (pune) return { ok: true, bonus: 4, label: job.work_mode === 'remote' ? 'Pune (remote)' : 'Pune' };
  if (job.work_mode !== 'remote') return { ok: false, label: 'outside Pune, not remote' };
  if (FOREIGN_ONLY.test(String(job.description || ''))) return { ok: false, label: 'remote but foreign-only' };
  const countries = job.countries || [], regions = job.regions || [];
  if (countries.includes('in')) return { ok: true, bonus: 2, label: 'remote (India)' };
  if (regions.includes('global') || regions.includes('apac') || (!countries.length && !regions.length)) return { ok: true, bonus: 1, label: 'remote (worldwide/APAC)' };
  return { ok: false, label: 'remote, other region only' };
}

// ---------------------------------------------------------------- score ----
const has = (list, s) => list.some(x => s.includes(x));
function score(job) {
  const title = ` ${String(job.title || '').toLowerCase()} `;
  const desc = String(job.description || '').toLowerCase();
  const skills = (job.skills || []).map(s => String(s).toLowerCase());
  const why = [];
  let s = 0;

  const arche = job.enrichment?.ai_archetype || job.ai_archetype;
  const archeList = Array.isArray(arche) ? arche : arche ? [arche] : [];
  if (archeList.some(a => S.target_archetypes.includes(a))) { s += 3; why.push(`archetype ${archeList.join('/')}`); }

  const aiTools = skills.filter(k => S.ai_tool_skills.includes(k));
  if (aiTools.length) { s += Math.min(6, aiTools.length * 2); why.push(`AI tools: ${aiTools.slice(0, 5).join(', ')}`); }

  const usage = S.ai_usage_phrases.filter(p => desc.includes(p));
  if (usage.length) { s += Math.min(3, usage.length); why.push(`JD mentions ${usage.slice(0, 3).join(', ')}`); }

  const mine = skills.filter(k => S.my_skills.includes(k));
  if (mine.length) { s += Math.min(3, mine.length); why.push(`your stack: ${mine.slice(0, 4).join(', ')}`); }

  const cats = [].concat(job.category || job.enrichment?.category || []);
  if (cats.some(c => S.target_categories.includes(c))) s += 1;

  if (has(S.title_positive, title)) { s += 2; why.push('title match'); }
  if (has(S.title_negative, title)) { s -= 6; why.push('title excluded'); }

  // Learned from the first 28 evaluations (26 Oct 2026): every Senior/Sr. title scored < 3.7,
  // Java-centred and data/ML-platform roles scored < 3.6. Rank them below likely 4.0+ roles.
  if (/\b(senior|sr\.?)\b/.test(title)) { s -= 5; why.push('senior title'); }
  const webStack = skills.some(k => ['javascript', 'typescript', 'react', 'nextjs', 'next-js', 'nodejs', 'node', 'python'].includes(k));
  if (/\bjava\b/.test(title) || (skills.includes('java') && !webStack)) { s -= 4; why.push('Java-centred'); }
  if (/\b(data engineer|database|data scientist|machine learning|ml engineer|mlops|data & ai|ai\/ml)\b/.test(title)) { s -= 3; why.push('data/ML-platform role'); }

  const sen = job.seniority || job.enrichment?.seniority;
  if (['lead', 'staff', 'principal', 'c_level'].includes(sen)) s -= 6;
  if (sen === 'senior') s -= 1;

  // Candidate has 3 years: a stated minimum of 4 is a stretch, 5+ is usually a no.
  const expMin = Number(job.enrichment?.experience_years_min ?? NaN);
  if (expMin >= 5) { s -= 4; why.push(`asks ${expMin}+ yrs`); }
  else if (expMin === 4) { s -= 1; why.push('asks 4+ yrs'); }

  const loc = locationFit(job);
  s += loc.bonus;
  if (loc.label) why.unshift(loc.label);

  if (job.reality?.fake_freshness) { s -= 5; why.push('fake freshness'); }
  if (job.closed_at) s = -99;
  return { score: s, why };
}

function offerUrl(job) {
  if (DIRECT_SOURCES.has(String(job.source || '').toLowerCase()) && job.url) return job.url.replace(/[?&]utm_source=freehire\.me/, '');
  return `https://freehire.me/jobs/${job.public_slug}`;
}

function htmlToText(s) {
  if (!/<[a-z][\s\S]*>/i.test(s)) return s;
  return s
    .replace(/<\s*(br|\/p|\/div|\/h[1-6]|\/ul|\/ol)\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function jdMarkdown(job) {
  return [
    `# ${job.title} — ${job.company}`, '',
    `Posted: ${job.posted_at ? job.posted_at.slice(0, 10) : 'not visible in source'}`,
    `Location: ${job.location || ''} · Work mode: ${job.work_mode || 'not stated'}`,
    `Apply (source): ${job.url || ''}`,
    `freehire page: https://freehire.me/jobs/${job.public_slug}`, '',
    htmlToText(String(job.description || '').trim()), '',
    job.skills?.length ? `Skills tagged by freehire: ${job.skills.join(', ')}` : '',
  ].join('\n');
}

// ----------------------------------------------------------------- main ----
async function main() {
  const firstRun = !existsSync(path.join(DATA_ROOT, 'data/freehire-seen.tsv'));
  const days = Number(flag('--days', firstRun ? CFG.freehire.first_run_open_within_days : CFG.freehire.open_within_days));
  const seen = knownUrls();
  const pool = new Map();

  for (const loc of CFG.freehire.locations) {
    for (const srch of CFG.freehire.searches) {
      const params = { ...loc.params, ...srch.params, open_within_days: String(days) };
      let rows = [];
      try { rows = await search(params); } catch (e) { console.warn(`  ⚠ ${srch.label} / ${loc.label}: ${e.message}`); }
      console.log(`  ${String(rows.length).padStart(3)} from "${srch.label}" · ${loc.label}`);
      for (const job of rows) if (!pool.has(job.public_slug)) pool.set(job.public_slug, { job, found: `${srch.label} · ${loc.label}` });
    }
  }

  const fresh = [];
  const dupTitle = new Set();
  for (const { job, found } of pool.values()) {
    const url = offerUrl(job);
    if (seen.has(urlKey(url)) || (job.url && seen.has(urlKey(job.url)))) continue;
    if (!locationFit(job).ok) continue; // no relocation, no foreign-only remote
    const titleKey = `${job.company}|${job.title}`.toLowerCase();
    if (dupTitle.has(titleKey)) continue;
    dupTitle.add(titleKey);
    const { score: sc, why } = score(job);
    fresh.push({ job, url, found, score: sc, why });
  }
  fresh.sort((a, b) => b.score - a.score || String(b.job.posted_at).localeCompare(String(a.job.posted_at)));
  const minScore = Number(flag('--min-score', CFG.min_scan_score ?? 6));
  const picked = fresh.filter(f => f.score >= minScore).slice(0, LIMIT);

  console.log(`\nfreehire: ${pool.size} jobs seen, ${fresh.length} new, ${picked.length} queued (min score ${minScore}, limit ${LIMIT}, last ${days} days).`);  for (const p of picked) console.log(`  [${p.score}] ${p.job.title} — ${p.job.company} (${p.job.location || p.job.work_mode}) · ${p.why.join('; ')}`);

  // Shortlist file the Claude app can read and show: top 25 including ones not queued.
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `# freehire shortlist — ${today}`, '',
    `${pool.size} jobs seen in the last ${days} days · ${fresh.length} new · ${picked.length} sent for full evaluation.`, '',
    '| Score | Role | Company | Where | Why | Link | Queued |', '|---|---|---|---|---|---|---|',
    ...fresh.slice(0, 25).map(f => `| ${f.score} | ${f.job.title.replace(/\|/g, '/')} | ${String(f.job.company).replace(/\|/g, '/')} | ${f.job.location || f.job.work_mode || ''} | ${f.why.join('; ').replace(/\|/g, '/')} | [open](${f.url}) | ${picked.includes(f) ? 'yes' : ''} |`),
  ];
  if (DRY) { console.log('\n(dry run: nothing written)'); return; }
  if (args.includes('--count-file')) writeFileSync(flag('--count-file'), String(picked.length));
  mkdirSync(path.join(DATA_ROOT, 'data'), { recursive: true });
  writeFileSync(path.join(DATA_ROOT, 'data/freehire-last-scan.md'), lines.join('\n') + '\n');
  if (!picked.length) return;

  // Lean pipeline mode: hand over a ranked candidate list; lean-hunt marks jobs seen only once evaluated.
  if (args.includes('--candidates-out')) {
    mkdirSync(path.join(DATA_ROOT, 'jds'), { recursive: true });
    const list = picked.map(p => {
      const jd = `jds/freehire-${p.job.public_slug}.md`;
      writeFileSync(path.join(DATA_ROOT, jd), jdMarkdown(p.job));
      return { source: 'freehire', url: p.url, apply_url: (p.job.url || p.url).replace(/[?&]utm_source=freehire\.me$/, ''), company: p.job.company,
        title: p.job.title, location: p.job.location || '', work_mode: p.job.work_mode || '', jd_file: jd, scan_score: p.score };
    });
    writeFileSync(flag('--candidates-out'), JSON.stringify(list, null, 2));
    return;
  }

  // Queue for career-ops: batch input (this run) + pipeline/scan-history (career-ops helpers keep their formats).
  const batchDir = path.join(CO_DIR, 'batch');
  const inputPath = path.join(batchDir, 'batch-input.tsv');
  if (!existsSync(inputPath)) writeFileSync(inputPath, 'id\turl\tsource\tnotes\n');
  const existing = readFileSync(inputPath, 'utf8').trim().split('\n').slice(1);
  let id = existing.reduce((m, l) => Math.max(m, Number(l.split('\t')[0]) || 0), 0);
  for (const p of picked) {
    const note = `${p.job.company} - ${p.job.title} | freehire score ${p.score} | apply: ${p.job.url || p.url}`.replace(/[\t\n]/g, ' ');
    appendFileSync(inputPath, `${++id}\t${p.url}\tfreehire\t${note}\n`);
  }
  // Clean JD text for each queued job: freehire's web page carries navigation and "similar jobs"
  // clutter, so the worker reads this file instead (see modes/_custom.md).
  mkdirSync(path.join(DATA_ROOT, 'jds'), { recursive: true });
  for (const p of picked) writeFileSync(path.join(DATA_ROOT, 'jds', `freehire-${p.job.public_slug}.md`), jdMarkdown(p.job));
  const offers = picked.map(p => ({ url: p.url, title: p.job.title, company: p.job.company, location: p.job.location || '', source: 'freehire' }));
  const scan = await import(pathToFileURL(path.join(CO_DIR, 'scan.mjs')).href);
  await scan.appendToScanHistory(offers, today, 'added');
  await scan.appendToPipeline(offers);
  const seenPath = path.join(DATA_ROOT, 'data/freehire-seen.tsv');
  if (!existsSync(seenPath)) writeFileSync(seenPath, 'date\tscore\turl\tcompany\ttitle\n');
  appendFileSync(seenPath, picked.map(p => `${today}\t${p.score}\t${p.url}\t${p.job.company}\t${p.job.title}`.replace(/\n/g, ' ')).join('\n') + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
