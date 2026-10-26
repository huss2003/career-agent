#!/usr/bin/env node
/**
 * run-summary.mjs — one readable summary of the run, for the GitHub Actions page,
 * for the Claude app (profile/data/last-run.md), and for the commit message.
 *
 * Usage: node scripts/run-summary.mjs [--commit-line]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CO_DIR = path.resolve(REPO, process.env.CAREER_OPS_DIR || '.career-ops');
const DATA_ROOT = path.resolve(REPO, process.env.CAREER_OPS_ROOT || 'profile');
const state = path.join(CO_DIR, 'batch', 'batch-state.tsv');
const input = path.join(CO_DIR, 'batch', 'batch-input.tsv');

const rows = existsSync(state)
  ? readFileSync(state, 'utf8').trim().split('\n').slice(1).filter(Boolean).map(l => {
      const [id, url, status, , , report_num, score, error] = l.split('\t');
      return { id, url, status, report_num, score, error };
    })
  : [];
const notes = new Map(existsSync(input)
  ? readFileSync(input, 'utf8').trim().split('\n').slice(1).map(l => { const c = l.split('\t'); return [c[0], c[3] || '']; })
  : []);

const reports = existsSync(path.join(DATA_ROOT, 'reports')) ? readdirSync(path.join(DATA_ROOT, 'reports')) : [];
const designed = existsSync(path.join(DATA_ROOT, 'output', 'designed')) ? readdirSync(path.join(DATA_ROOT, 'output', 'designed')) : [];
const reportFor = n => n && reports.find(r => r.startsWith(`${String(n).padStart(3, '0')}-`));
const designedFor = n => n && designed.find(d => d.includes(`_${String(n).padStart(3, '0')}-`) && d.endsWith('.pdf'));

const done = rows.filter(r => r.status === 'completed');
const when = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const L = [`# Job agent run — ${when}`, ''];
if (!rows.length) L.push('No jobs were evaluated in this run.');
else {
  L.push(`${done.length} evaluated · ${rows.filter(r => r.status === 'skipped').length} skipped · ${rows.filter(r => r.status === 'failed').length} failed`, '');
  L.push('| Score | Job | Status | Report | Designed CV |', '|---|---|---|---|---|');
  for (const r of rows.sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0))) {
    const rep = reportFor(r.report_num);
    const des = designedFor(r.report_num);
    const job = (notes.get(r.id) || r.url).split(' | ')[0].replace(/\|/g, '/');
    L.push(`| ${r.score || '—'} | [${job}](${r.url}) | ${r.status}${r.error ? ` (${r.error.slice(0, 60)})` : ''} | ${rep ? `[${rep}](../reports/${rep})` : '—'} | ${des ? `[PDF](../output/designed/${encodeURI(des)})` : '—'} |`);
  }
}
L.push('', 'Scores are out of 5. career-ops recommends applying only at 4.0 or above. Nothing was submitted: you review and click Apply yourself.');

const md = L.join('\n') + '\n';
if (process.argv.includes('--commit-line')) {
  const best = done.map(r => parseFloat(r.score)).filter(Number.isFinite).sort((a, b) => b - a)[0];
  console.log(`agent run: ${done.length} evaluated${best ? `, best ${best}/5` : ''}`);
} else {
  writeFileSync(path.join(DATA_ROOT, 'data', 'last-run.md'), md);
  process.stdout.write(md);
}
