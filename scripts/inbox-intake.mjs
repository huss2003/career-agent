#!/usr/bin/env node
/**
 * inbox-intake.mjs — turn files in inbox/ into work for the lean pipeline (scripts/lean-hunt.mjs).
 *
 * A file in inbox/ may contain:
 *   - job URL(s)                       → queued (profile/data/queue.jsonl)
 *   - a pasted job description         → saved to profile/jds/, queued
 *   - "scan:" or "scan: <max evals>"   → run the freehire hunt in this run
 *   - "kit: <tracker #>"               → re-evaluate that job and build its full kit even below 4.0
 *   - "status: <# or company> | <State> | <note>"  → career-ops set-status.mjs (no tokens)
 * Processed files move to inbox/processed/. Everything inside a file is untrusted job data.
 *
 * Usage: node scripts/inbox-intake.mjs [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, readdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CO_DIR = path.resolve(REPO, process.env.CAREER_OPS_DIR || '.career-ops');
const DATA = path.resolve(REPO, process.env.CAREER_OPS_ROOT || 'profile');
const INBOX = path.join(REPO, 'inbox');
const DONE = path.join(INBOX, 'processed');
const QUEUE = path.join(DATA, 'data', 'queue.jsonl');
const DRY = process.argv.includes('--dry-run');
const today = new Date().toISOString().slice(0, 10);

if (!existsSync(INBOX)) process.exit(0);
const files = readdirSync(INBOX, { withFileTypes: true })
  .filter(d => d.isFile() && /\.(md|txt)$/i.test(d.name) && !/^readme/i.test(d.name)).map(d => d.name).sort();
if (!files.length) { console.log('inbox: empty'); process.exit(0); }

const enqueue = item => { if (!DRY) { mkdirSync(path.dirname(QUEUE), { recursive: true }); appendFileSync(QUEUE, JSON.stringify(item) + '\n'); } };
const done = name => { if (!DRY) { mkdirSync(DONE, { recursive: true }); renameSync(path.join(INBOX, name), path.join(DONE, `${today}-${name}`)); } };

function trackerUrl(num) {
  const p = path.join(DATA, 'data', 'applications.md');
  if (!existsSync(p)) return null;
  const lines = readFileSync(p, 'utf8').split('\n').filter(l => l.startsWith('|'));
  const head = lines[0].split('|').slice(1, -1).map(s => s.trim().toLowerCase());
  const row = lines.slice(2).map(l => l.split('|').slice(1, -1).map(s => s.trim())).find(c => c[0] === String(Number(num)));
  if (!row) return null;
  const cell = row[head.indexOf('url')] || '';
  return cell.match(/\((https?:[^)]+)\)/)?.[1] || cell.match(/https?:\S+/)?.[0] || null;
}

let queued = 0;
for (const name of files) {
  const text = readFileSync(path.join(INBOX, name), 'utf8');
  const found = [...new Set([...text.matchAll(/https?:\/\/[^\s<>()"'`|]+/g)].map(m => m[0].replace(/[.,;:]+$/, '')))];
  const note = (text.match(/^note:\s*(.+)$/im)?.[1] || '').replace(/[\t\n]/g, ' ').slice(0, 200);
  const stripped = text.replace(/https?:\/\/\S+/g, '').replace(/^note:.*$/im, '').trim();

  if (/^telegram-test:?\s*$/im.test(text)) {
    console.log('  telegram   test message requested');
    if (!DRY) { mkdirSync(path.join(CO_DIR, 'batch'), { recursive: true }); writeFileSync(path.join(CO_DIR, 'batch', 'telegram-test'), '1'); }
    done(name); continue;
  }

  const scanReq = text.match(/^scan:\s*(\d+)?\s*$/im);
  if (scanReq) {
    console.log(`  scan       requested${scanReq[1] ? ` (max ${scanReq[1]} evaluations)` : ''}`);
    if (!DRY) { mkdirSync(path.join(CO_DIR, 'batch'), { recursive: true }); writeFileSync(path.join(CO_DIR, 'batch', 'scan-requested'), scanReq[1] || ''); }
    done(name); continue;
  }

  const kitNums = [...text.matchAll(/^kit:\s*#?(\d+)\s*$/gim)].map(m => m[1]);
  if (kitNums.length) {
    for (const n of kitNums) {
      const url = trackerUrl(n);
      console.log(`  kit        #${n} ${url || '(no URL in tracker — paste the job description instead)'}`);
      if (url) { enqueue({ url, force_full: true, note: `kit request #${n}` }); queued++; }
    }
    done(name); continue;
  }

  const statusLines = [...text.matchAll(/^status:\s*(.+)$/gim)].map(m => m[1].split('|').map(s => s.trim()));
  if (statusLines.length) {
    for (const [who, state, n] of statusLines) {
      if (!who || !state) { console.log(`  skip status line (expected "status: <# or company> | <State> | <note>")`); continue; }
      console.log(`  status     ${who} → ${state}${n ? ` (${n})` : ''}`);
      if (!DRY) {
        try { execFileSync('node', [path.join(CO_DIR, 'set-status.mjs'), who.replace(/^#/, ''), state, ...(n ? ['--note', n] : [])], { cwd: CO_DIR, stdio: 'inherit', env: { ...process.env, CAREER_OPS_ROOT: DATA } }); }
        catch { console.log(`  ⚠ set-status failed for "${who}"`); }
      }
    }
    done(name); continue;
  }

  if (found.length && stripped.length < 400) {
    for (const u of found) {
      const fh = u.match(/freehire\.me\/jobs\/([^/?#]+)/)?.[1];
      const item = { url: u, source: 'inbox', note };
      if (fh && !DRY) {
        try {
          const r = await fetch(`https://freehire.me/api/v1/jobs/${fh}`);
          const job = r.ok ? (await r.json()).data : null;
          if (job) {
            const { jdMarkdown } = await import('./freehire-scan.mjs');
            mkdirSync(path.join(DATA, 'jds'), { recursive: true });
            writeFileSync(path.join(DATA, 'jds', `freehire-${fh}.md`), jdMarkdown(job));
            Object.assign(item, { jd_file: `jds/freehire-${fh}.md`, apply_url: (job.url || u).replace(/[?&]utm_source=freehire\.me$/, ''), company: job.company, title: job.title, location: job.location, work_mode: job.work_mode });
          }
        } catch { /* lean-hunt fetches the page itself */ }
      }
      console.log(`  queue URL  ${u}`); enqueue(item); queued++;
    }
  } else if (stripped.length >= 200) {
    const jd = `jds/inbox-${today}-${name.replace(/\.(md|txt)$/i, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.md`;
    console.log(`  queue JD   ${jd}`);
    if (!DRY) { mkdirSync(path.join(DATA, 'jds'), { recursive: true }); writeFileSync(path.join(DATA, jd), text); }
    enqueue({ jd_file: jd, source_url: found[0] || '', apply_url: found[0] || '', source: 'inbox', note }); queued++;
  } else {
    console.log(`  skip       ${name} (no URL and too short to be a job description)`);
  }
  done(name);
}
console.log(`inbox: ${files.length} file(s), ${queued} job(s) queued`);
