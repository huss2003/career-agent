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

  const sen = job.seniority || job.enrichment?.seniority;
  if (['lead', 'staff', 'principal', 'c_level'].includes(sen)) s -= 6;
  if (sen === 'senior') s -= 1;

  // Candidate has 3 years: a stated minimum of 4 is a stretch, 5+ is usually a no.
  const expMin = Number(job.enrichment?.experience_years_min ?? NaN);
  if (expMin >= 5) { s -= 4; why.push(`asks ${expMin}+ yrs`); }
  else if (expMin === 4) { s -= 1; why.push('asks 4+ yrs'); }

  const city = String(job.location || '').toLowerCase();
  if (job.work_mode === 'remote' || has(S.preferred_cities, city)) { s += 1; why.push(job.work_mode === 'remote' ? 'remote' : 'Pune'); }

  if (job.reality?.fake_freshness) { s -= 5; why.push('fake freshness'); }
  if (job.closed_at) s = -99;
  return { score: s, why };
}

function offerUrl(job) {
  if (DIRECT_SOURCES.has(String(job.source || '').toLowerCase()) && job.url) return job.url.replace(/[?&]utm_source=freehire\.me/, '');
  return `https://freehire.me/jobs/${job.public_slug}`;
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
    const titleKey = `${job.company}|${job.title}`.toLowerCase();
    if (dupTitle.has(titleKey)) continue;
    dupTitle.add(titleKey);
    const { score: sc, why } = score(job);
    fresh.push({ job, url, found, score: sc, why });
  }
  fresh.sort((a, b) => b.score - a.score || String(b.job.posted_at).localeCompare(String(a.job.posted_at)));
  const picked = fresh.filter(f => f.score >= (CFG.min_scan_score ?? 6)).slice(0, LIMIT);

  console.log(`\nfreehire: ${pool.size} jobs seen, ${fresh.length} new, ${picked.length} queued (min score ${CFG.min_scan_score}, limit ${LIMIT}, last ${days} days).`);
  for (const p of picked) console.log(`  [${p.score}] ${p.job.title} — ${p.job.company} (${p.job.location || p.job.work_mode}) · ${p.why.join('; ')}`);

  // Shortlist file the Claude app can read and show: top 25 including ones not queued.
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    `# freehire shortlist — ${today}`, '',
    `${pool.size} jobs seen in the last ${days} days · ${fresh.length} new · ${picked.length} sent for full evaluation.`, '',
    '| Score | Role | Company | Where | Why | Link | Queued |', '|---|---|---|---|---|---|---|',
    ...fresh.slice(0, 25).map(f => `| ${f.score} | ${f.job.title.replace(/\|/g, '/')} | ${String(f.job.company).replace(/\|/g, '/')} | ${f.job.location || f.job.work_mode || ''} | ${f.why.join('; ').replace(/\|/g, '/')} | [open](${f.url}) | ${picked.includes(f) ? 'yes' : ''} |`),
  ];
  if (DRY) { console.log('\n(dry run: nothing written)'); return; }
  mkdirSync(path.join(DATA_ROOT, 'data'), { recursive: true });
  writeFileSync(path.join(DATA_ROOT, 'data/freehire-last-scan.md'), lines.join('\n') + '\n');
  if (!picked.length) return;

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
  const offers = picked.map(p => ({ url: p.url, title: p.job.title, company: p.job.company, location: p.job.location || '', source: 'freehire' }));
  const scan = await import(pathToFileURL(path.join(CO_DIR, 'scan.mjs')).href);
  await scan.appendToScanHistory(offers, today, 'added');
  await scan.appendToPipeline(offers);
  const seenPath = path.join(DATA_ROOT, 'data/freehire-seen.tsv');
  if (!existsSync(seenPath)) writeFileSync(seenPath, 'date\tscore\turl\tcompany\ttitle\n');
  appendFileSync(seenPath, picked.map(p => `${today}\t${p.score}\t${p.url}\t${p.job.company}\t${p.job.title}`.replace(/\n/g, ' ')).join('\n') + '\n');
}

main().catch(e => { console.error(e); process.exit(1); });
