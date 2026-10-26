#!/usr/bin/env node
/**
 * daily-count.mjs — how many jobs were evaluated today and how many qualified (score >= kit_min_score).
 * Prints "<qualified> <evaluated>" for the workflow's scan-until-target loop.
 * "Today" is the tracker's Date column, which career-ops writes in the runner's (UTC) date.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CFG = JSON.parse(readFileSync(path.join(REPO, 'agent.config.json'), 'utf8'));
const DATA = path.resolve(REPO, process.env.CAREER_OPS_ROOT || 'profile');
const MIN = Number(CFG.kit_min_score ?? 4.0);
const today = process.env.TODAY || new Date().toISOString().slice(0, 10);

const p = path.join(DATA, 'data', 'applications.md');
let qualified = 0, evaluated = 0;
if (existsSync(p)) {
  const lines = readFileSync(p, 'utf8').split('\n').filter(l => l.startsWith('|'));
  const head = (lines[0] || '').split('|').slice(1, -1).map(s => s.trim().toLowerCase());
  const di = head.indexOf('date'), si = head.indexOf('score');
  for (const l of lines.slice(2)) {
    const c = l.split('|').slice(1, -1).map(s => s.trim());
    if (c[di] !== today) continue;
    const score = parseFloat(c[si]);
    if (!Number.isFinite(score)) continue;
    evaluated++;
    if (score >= MIN) qualified++;
  }
}
console.log(`${qualified} ${evaluated}`);
