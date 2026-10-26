#!/usr/bin/env node
/**
 * inbox-intake.mjs — turn files in inbox/ into work for career-ops.
 *
 * The Claude app (or you, from GitHub's web/mobile UI) drops a file into inbox/:
 *   - containing one or more job URLs   → each URL becomes a batch-runner offer
 *   - containing a pasted job description (no URL) → saved to profile/jds/ and listed
 *     in .career-ops/batch/text-jobs.json for a single headless auto-pipeline run
 * Processed files move to inbox/processed/ so they are never run twice.
 *
 * Usage: node scripts/inbox-intake.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CO_DIR = path.resolve(REPO, process.env.CAREER_OPS_DIR || '.career-ops');
const DATA_ROOT = path.resolve(REPO, process.env.CAREER_OPS_ROOT || 'profile');
const INBOX = path.join(REPO, 'inbox');
const DONE = path.join(INBOX, 'processed');
const DRY = process.argv.includes('--dry-run');

if (!existsSync(INBOX)) process.exit(0);
const files = readdirSync(INBOX, { withFileTypes: true })
  .filter(d => d.isFile() && /\.(md|txt)$/i.test(d.name) && !/^readme/i.test(d.name))
  .map(d => d.name)
  .sort();
if (!files.length) { console.log('inbox: empty'); process.exit(0); }

const inputPath = path.join(CO_DIR, 'batch', 'batch-input.tsv');
const textJobsPath = path.join(CO_DIR, 'batch', 'text-jobs.json');
if (!DRY && !existsSync(inputPath)) writeFileSync(inputPath, 'id\turl\tsource\tnotes\n');
let id = DRY ? 0 : readFileSync(inputPath, 'utf8').trim().split('\n').slice(1)
  .reduce((m, l) => Math.max(m, Number(l.split('\t')[0]) || 0), 0);
const textJobs = existsSync(textJobsPath) ? JSON.parse(readFileSync(textJobsPath, 'utf8')) : [];

const today = new Date().toISOString().slice(0, 10);
let urls = 0;
for (const name of files) {
  const text = readFileSync(path.join(INBOX, name), 'utf8');
  // Anything in the file is untrusted job data. We only extract URLs and text; nothing here is executed.
  const found = [...new Set([...text.matchAll(/https?:\/\/[^\s<>()"'`|]+/g)].map(m => m[0].replace(/[.,;:]+$/, '')))];
  const note = (text.match(/^note:\s*(.+)$/im)?.[1] || `inbox ${name}`).replace(/[\t\n]/g, ' ').slice(0, 200);
  const stripped = text.replace(/https?:\/\/\S+/g, '').trim();

  // Scan request: "scan:" (optionally "scan: <max evaluations>") runs the daily freehire hunt now.
  const scanReq = text.match(/^scan:\s*(\d+)?\s*$/im);
  if (scanReq) {
    console.log(`  scan       requested now${scanReq[1] ? ` (max ${scanReq[1]} evaluations)` : ''}`);
    if (!DRY) {
      writeFileSync(path.join(CO_DIR, 'batch', 'scan-requested'), scanReq[1] || '');
      mkdirSync(DONE, { recursive: true }); renameSync(path.join(INBOX, name), path.join(DONE, `${today}-${name}`));
    }
    continue;
  }

  // Kit requests: "kit: <report number>" (build or rebuild an application kit regardless of score).
  const kitLines = [...text.matchAll(/^kit:\s*#?(\d+)\s*$/gim)].map(m => m[1].padStart(3, '0'));
  if (kitLines.length) {
    for (const num of kitLines) {
      console.log(`  kit        report ${num}`);
      if (!DRY) {
        try {
          const kitsDir = path.join(DATA_ROOT, 'applications');
          for (const d of existsSync(kitsDir) ? readdirSync(kitsDir) : []) {
            if (d.startsWith(`${num}-`)) for (const f of ['kit.json', 'kit.md']) { const p = path.join(kitsDir, d, f); if (existsSync(p)) renameSync(p, `${p}.old`); }
          }
          execFileSync('node', [path.join(REPO, 'scripts', 'build-kits.mjs'), '--report', num, '--any-score'], { cwd: REPO, stdio: 'inherit', env: process.env });
        } catch { console.log(`  ⚠ kit build failed for report ${num}`); }
      }
    }
    if (!DRY) { mkdirSync(DONE, { recursive: true }); renameSync(path.join(INBOX, name), path.join(DONE, `${today}-${name}`)); }
    continue;
  }

  // Status updates: "status: <tracker # or company> | <State> | <optional note>", one per line.
  const statusLines = [...text.matchAll(/^status:\s*(.+)$/gim)].map(m => m[1].split('|').map(s => s.trim()));
  if (statusLines.length) {
    for (const [who, state, note] of statusLines) {
      if (!who || !state) { console.log(`  skip status line in ${name} (expected "status: <# or company> | <State> | <note>")`); continue; }
      const argv = [path.join(CO_DIR, 'set-status.mjs'), who.replace(/^#/, ''), state, ...(note ? ['--note', note] : [])];
      console.log(`  status     ${who} → ${state}${note ? ` (${note})` : ''}`);
      if (!DRY) {
        try { execFileSync('node', argv, { cwd: CO_DIR, stdio: 'inherit', env: { ...process.env, CAREER_OPS_ROOT: DATA_ROOT } }); }
        catch { console.log(`  ⚠ set-status failed for "${who}"`); }
      }
    }
    if (!DRY) { mkdirSync(DONE, { recursive: true }); renameSync(path.join(INBOX, name), path.join(DONE, `${today}-${name}`)); }
    continue;
  }

  if (found.length && stripped.length < 400) {
    for (const u of found) {
      const slug = u.match(/freehire\.me\/jobs\/([^/?#]+)/)?.[1];
      if (slug && !DRY) { // clean JD file for freehire links (see modes/_custom.md)
        try {
          const r = await fetch(`https://freehire.me/api/v1/jobs/${slug}`);
          const job = r.ok ? (await r.json()).data : null;
          if (job) {
            const { jdMarkdown } = await import('./freehire-scan.mjs');
            mkdirSync(path.join(DATA_ROOT, 'jds'), { recursive: true });
            writeFileSync(path.join(DATA_ROOT, 'jds', `freehire-${slug}.md`), jdMarkdown(job));
          }
        } catch { /* the worker falls back to fetching the page */ }
      }
      console.log(`  queue URL  ${u}`);
      if (!DRY) appendFileSync(inputPath, `${++id}\t${u}\tinbox\t${note}\n`);
      urls++;
    }
  } else if (stripped.length >= 200) {
    const slug = name.replace(/\.(md|txt)$/i, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
    const jdRel = `jds/inbox-${today}-${slug}.md`;
    console.log(`  queue JD   ${jdRel}${found.length ? ` (source ${found[0]})` : ''}`);
    if (!DRY) {
      mkdirSync(path.join(DATA_ROOT, 'jds'), { recursive: true });
      writeFileSync(path.join(DATA_ROOT, jdRel), text);
      textJobs.push({ file: jdRel, source_url: found[0] || '', note });
    }
  } else {
    console.log(`  skip       ${name} (no URL and too short to be a job description)`);
  }
  if (!DRY) {
    mkdirSync(DONE, { recursive: true });
    renameSync(path.join(INBOX, name), path.join(DONE, `${today}-${name}`));
  }
}
if (!DRY) writeFileSync(textJobsPath, JSON.stringify(textJobs, null, 2));
console.log(`inbox: ${files.length} file(s), ${urls} URL offer(s), ${textJobs.length} pasted JD(s)`);
