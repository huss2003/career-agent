#!/usr/bin/env node
/**
 * notify-telegram.mjs — send each new application kit to Hussain on Telegram:
 * one message per job (score, role, location, why it fits, apply link) with the
 * ATS CV, designed CV and cover letter attached as files, then a short daily total.
 *
 * Secrets (GitHub → Settings → Secrets and variables → Actions):
 *   TELEGRAM_BOT_TOKEN  required — from @BotFather
 *   TELEGRAM_CHAT_ID    optional — found automatically from the last message you sent the bot
 * Without a token this script does nothing. Sent kits are recorded in
 * profile/data/telegram-sent.tsv so nothing is sent twice.
 */
import { readFileSync, existsSync, readdirSync, appendFileSync, writeFileSync, openAsBlob } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = path.resolve(REPO, process.env.CAREER_OPS_ROOT || 'profile');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GH = 'https://github.com/huss2003/career-agent/blob/main/';
const LEDGER = path.join(DATA, 'data', 'telegram-sent.tsv');
const STATUS = path.join(DATA, 'data', 'telegram-status.md');
const TEST_FLAG = path.join(path.resolve(REPO, process.env.CAREER_OPS_DIR || '.career-ops'), 'batch', 'telegram-test');
const status = (msg) => { try { writeFileSync(STATUS, `# Telegram status\n\n${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC — ${msg}\n`); } catch {} console.log(`telegram: ${msg}`); };

if (!TOKEN) { status('NOT SENT: no TELEGRAM_BOT_TOKEN secret in GitHub (Settings → Secrets and variables → Actions). Name must be exactly TELEGRAM_BOT_TOKEN.'); process.exit(0); }
const api = (method) => `https://api.telegram.org/bot${TOKEN}/${method}`;

async function call(method, body) {
  const r = await fetch(api(method), body instanceof FormData ? { method: 'POST', body } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error(`${method}: ${j.description || r.status}`);
  return j.result;
}

async function chatId() {
  if (process.env.TELEGRAM_CHAT_ID) return process.env.TELEGRAM_CHAT_ID;
  const updates = await call('getUpdates', { limit: 100 });
  const last = [...updates].reverse().find(u => u.message?.chat?.id);
  if (!last) throw new Error('no chat found: open your bot in Telegram and send it /start, then run again');
  return String(last.message.chat.id);
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function main() {
  const me = await call('getMe').catch(e => { throw new Error(`token rejected by Telegram (${e.message}). Re-copy the token from @BotFather into the TELEGRAM_BOT_TOKEN secret.`); });
  const chat = await chatId().catch(e => { throw new Error(`bot @${me.username} works, but ${e.message}`); });
  if (existsSync(TEST_FLAG)) {
    await call('sendMessage', { chat_id: chat, text: `✅ Test from your job agent (@${me.username}).\nTelegram delivery works. Every job scoring 4.0+ will arrive here with the Apply link and your CVs attached.` });
  }
  const kitsDir = path.join(DATA, 'applications');
  if (!existsSync(kitsDir)) { status(`OK: bot @${me.username} reached chat ${chat}; no kits yet`); return; }
  const sent = new Set(existsSync(LEDGER) ? readFileSync(LEDGER, 'utf8').split('\n').map(l => l.split('\t')[1]).filter(Boolean) : []);
  const fresh = readdirSync(kitsDir).filter(d => existsSync(path.join(kitsDir, d, 'kit.md')) && !sent.has(d)).sort();
  if (!fresh.length) { status(`OK: bot @${me.username} reached chat ${chat}; nothing new to send`); return; }

  if (!existsSync(LEDGER)) writeFileSync(LEDGER, 'date\tkit\n');
  const today = new Date().toISOString().slice(0, 10);
  let n = 0;

  for (const d of fresh) {
    const dir = path.join(kitsDir, d);
    const kit = JSON.parse(readFileSync(path.join(dir, 'kit.json'), 'utf8'));
    const ctx = existsSync(path.join(dir, 'context.json')) ? JSON.parse(readFileSync(path.join(dir, 'context.json'), 'utf8')) : {};
    const files = ctx.files || {};
    const lines = [
      `<b>${esc(kit.score || ctx.score)} — ${esc(kit.role || ctx.role)}</b>`,
      `${esc(kit.company || ctx.company)}`,
      '',
      kit.fit_line ? `✅ ${esc(kit.fit_line)}` : '',
      kit.ai_in_job && kit.ai_in_job !== 'not stated' ? `🤖 ${esc(String(kit.ai_in_job).slice(0, 300))}` : '',
      (kit.knockout_warnings || []).length ? `⚠️ ${esc(kit.knockout_warnings.slice(0, 2).join(' · ').slice(0, 400))}` : '',
      (kit.needs_you || []).length ? `✍️ You answer: ${esc(kit.needs_you.slice(0, 3).join(' · ').slice(0, 300))}` : '',
      '',
      `👉 <a href="${esc(kit.apply_url || ctx.apply_url)}">Apply here</a>  ·  <a href="${GH}profile/applications/${d}/kit.md">Full kit (answers, cover letter)</a>`,
      ctx.ats_score ? `🧾 ATS check ${ctx.ats_score}/100 · fact check passed${ctx.keyword_coverage ? ` · JD keyword match ${ctx.keyword_coverage}` : ''}` : '',
      'Attached: ATS CV (for the form), designed CV (email/DMs), cover letter.',
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '');
    await call('sendMessage', { chat_id: chat, text: lines.join('\n').slice(0, 4000), parse_mode: 'HTML', disable_web_page_preview: true });

    const docs = [
      files.ats_cv && [path.resolve(REPO, files.ats_cv), 'ATS CV — upload this to the application form', `Hussain_Singapuri_CV_${d.replace(/^\d+-/, '')}.pdf`],
      files.designed_cv && [path.resolve(REPO, files.designed_cv), 'Designed CV — for email, DMs, portfolio'],
      existsSync(path.join(dir, 'cover-letter.pdf')) && [path.join(dir, 'cover-letter.pdf'), 'Cover letter', `Hussain_Singapuri_Cover_Letter_${d.replace(/^\d+-/, '')}.pdf`],
    ].filter(Boolean).filter(([p]) => existsSync(p));
    for (const [p, caption, name] of docs) {
      const form = new FormData();
      form.append('chat_id', chat);
      form.append('caption', caption);
      form.append('document', await openAsBlob(p), name || path.basename(p));
      await call('sendDocument', form);
    }
    appendFileSync(LEDGER, `${today}\t${d}\n`);
    n++;
  }
  await call('sendMessage', { chat_id: chat, text: `📋 ${n} new job${n === 1 ? '' : 's'} scoring 4.0+ ready to apply. Nothing was submitted — you apply with the link and the attached CV.` });
  status(`OK: bot @${me.username} sent ${n} job(s) to chat ${chat}`);
}

main().catch(e => { status(`NOT SENT: ${e.message}`); console.log(`::warning::telegram: ${e.message}`); });
