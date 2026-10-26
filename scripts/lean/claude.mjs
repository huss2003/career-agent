/**
 * Lean, budget-capped Claude calls for the job agent.
 *
 * Token strategy (why this is cheap):
 *  - `claude -p` with our own --system-prompt-file and --tools "": no Claude Code agent prompt,
 *    no tool definitions, no multi-turn loop. One request, one answer.
 *  - The system prompt (rules + CV + profile) is identical for every job, so after the first call it
 *    is served from the prompt cache at a fraction of the price. Calls run back to back to keep it warm.
 *  - The per-job user message is only the job description (trimmed) plus the apply URL.
 *  - Every call carries --max-budget-usd, and a ledger enforces the daily cap across all runs.
 *
 * Ledger: profile/data/api-spend.tsv  (date_utc, time, stage, label, usd, input, cache_read, cache_write, output)
 * The ledger is committed after each run, so all runs on the same day share one budget.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const CFG = JSON.parse(readFileSync(path.join(REPO, 'agent.config.json'), 'utf8'));
const DATA = path.resolve(REPO, process.env.CAREER_OPS_ROOT || 'profile');
const LEDGER = path.join(DATA, 'data', 'api-spend.tsv');

export const BUDGET = Number(CFG.budget_usd_per_day ?? 5);
export const RESERVE = Number(CFG.budget_reserve_usd ?? 0.3);
export const MAX_PER_CALL = Number(CFG.max_usd_per_call ?? 0.35);
export const MODEL = CFG.model || 'claude-sonnet-5-5';
const today = () => new Date().toISOString().slice(0, 10);

export function spentToday() {
  if (!existsSync(LEDGER)) return 0;
  return readFileSync(LEDGER, 'utf8').split('\n').slice(1)
    .map(l => l.split('\t')).filter(c => c[0] === today())
    .reduce((s, c) => s + (Number(c[4]) || 0), 0);
}

function record(stage, label, r) {
  mkdirSync(path.dirname(LEDGER), { recursive: true });
  if (!existsSync(LEDGER)) writeFileSync(LEDGER, 'date_utc\ttime\tstage\tlabel\tusd\tinput\tcache_read\tcache_write\toutput\n');
  const u = Object.values(r.modelUsage || {})[0] || {};
  const row = [today(), new Date().toISOString().slice(11, 19), stage, String(label).replace(/[\t\n]/g, ' ').slice(0, 80),
    (r.total_cost_usd ?? 0).toFixed(5), u.inputTokens ?? '', u.cacheReadInputTokens ?? '', u.cacheCreationInputTokens ?? '', u.outputTokens ?? ''];
  appendFileSync(LEDGER, row.join('\t') + '\n');
}

/** Can we afford one more call of up to `est` dollars without breaking the daily cap? */
export function canAfford(est = MAX_PER_CALL) {
  return spentToday() + est <= BUDGET - RESERVE;
}

let sysFile = null;
export function setSystemPrompt(text) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'lean-'));
  sysFile = path.join(dir, 'system.md');
  writeFileSync(sysFile, text);
}

/**
 * One lean call. Returns { text, cost, ok, error }.
 * Refuses (no API call) when the daily budget cannot cover `maxUsd`.
 */
export function callClaude(user, { stage = 'eval', label = '', maxUsd = MAX_PER_CALL } = {}) {
  if (!sysFile) throw new Error('setSystemPrompt() first');
  if (!canAfford(maxUsd)) return Promise.resolve({ ok: false, error: 'daily budget reached', cost: 0, text: '' });
  const args = ['-p', '--model', MODEL, '--system-prompt-file', sysFile, '--tools', '', '--strict-mcp-config',
    '--setting-sources', '', '--no-session-persistence', '--output-format', 'json', '--max-turns', '1',
    '--max-budget-usd', String(maxUsd), user];
  return new Promise(resolve => {
    execFile('claude', args, { maxBuffer: 32 * 1024 * 1024, timeout: 6 * 60_000, env: process.env }, (err, stdout) => {
      let r;
      try { r = JSON.parse(stdout); } catch { return resolve({ ok: false, error: `bad CLI output: ${String(err?.message || stdout).slice(0, 200)}`, cost: 0, text: '' }); }
      record(stage, label, r);
      if (r.is_error || r.subtype !== 'success') return resolve({ ok: false, error: r.subtype || 'error', cost: r.total_cost_usd || 0, text: r.result || '' });
      resolve({ ok: true, text: r.result || '', cost: r.total_cost_usd || 0 });
    });
  });
}

/** Pull the first JSON object out of a model reply (tolerates ```json fences). */
export function parseJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(raw);
}
