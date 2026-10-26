#!/usr/bin/env node
/**
 * notify-email.mjs — email the new application kits to Hussain through his own Gmail.
 *
 * One email per run with new kits: a card per job (score, role, company, why it fits, AI in the job,
 * warnings, Apply button, full-kit link) and, attached, each job's ATS CV, designed CV and cover letter.
 * Scheduled runs with nothing new send a one-line "no new jobs" note so silence never means "broken".
 *
 * Secrets (GitHub → Settings → Secrets and variables → Actions):
 *   GMAIL_APP_PASSWORD   16-character Gmail app password (Google Account → Security → App passwords)
 * Address: agent.config.json → email.to / email.from (default Hussainsingapuri24@gmail.com).
 * Sent kits are recorded in profile/data/email-sent.tsv; the result of each run in profile/data/email-status.md.
 */
import { readFileSync, existsSync, readdirSync, appendFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CFG = JSON.parse(readFileSync(path.join(REPO, 'agent.config.json'), 'utf8'));
const DATA = path.resolve(REPO, process.env.CAREER_OPS_ROOT || 'profile');
const TO = CFG.email?.to || 'Hussainsingapuri24@gmail.com';
const FROM = CFG.email?.from || TO;
const PASS = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const LEDGER = path.join(DATA, 'data', 'email-sent.tsv');
const STATUS = path.join(DATA, 'data', 'email-status.md');
const GH = 'https://github.com/huss2003/career-agent/blob/main/';
const SCHEDULED = process.env.GITHUB_EVENT_NAME === 'schedule' || process.argv.includes('--always');
const TEST = process.argv.includes('--test') || existsSync(path.join(path.resolve(REPO, process.env.CAREER_OPS_DIR || '.career-ops'), 'batch', 'email-test'));

const status = m => { try { writeFileSync(STATUS, `# Email status\n\n${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC — ${m}\n`); } catch {} console.log(`email: ${m}`); };
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function card(kit, ctx, dir) {
  const warn = (kit.knockout_warnings || []).slice(0, 2);
  const you = (kit.needs_you || []).slice(0, 3);
  const apply = kit.apply_url || ctx.apply_url;
  return `
  <tr><td style="padding:18px 20px;border:1px solid #d7dccf;border-radius:10px;background:#ffffff">
    <div style="font:600 13px Arial;color:#3E5C2F">${esc(kit.score || ctx.score)} · ${esc(kit.company || ctx.company)}</div>
    <div style="font:700 18px Georgia,serif;color:#16241A;margin:4px 0 8px">${esc(kit.role || ctx.role)}</div>
    ${kit.fit_line ? `<div style="font:14px/1.45 Arial;color:#16241A;margin-bottom:6px">✅ ${esc(kit.fit_line)}</div>` : ''}
    ${kit.ai_in_job && kit.ai_in_job !== 'not stated' ? `<div style="font:13px/1.45 Arial;color:#56634F;margin-bottom:6px">🤖 ${esc(String(kit.ai_in_job).slice(0, 260))}</div>` : ''}
    ${warn.length ? `<div style="font:13px/1.45 Arial;color:#8A4B1F;margin-bottom:6px">⚠️ ${esc(warn.join(' · ').slice(0, 360))}</div>` : ''}
    ${you.length ? `<div style="font:13px/1.45 Arial;color:#56634F;margin-bottom:6px">✍️ You answer: ${esc(you.join(' · ').slice(0, 260))}</div>` : ''}
    ${ctx.ats_score ? `<div style="font:12px Arial;color:#56634F;margin-bottom:10px">ATS check ${esc(ctx.ats_score)}/100 · fact check passed${ctx.keyword_coverage ? ` · keyword match ${esc(ctx.keyword_coverage)}` : ''}</div>` : ''}
    <a href="${esc(apply)}" style="display:inline-block;background:#C6FF00;color:#16241A;font:700 14px Arial;padding:10px 18px;border-radius:6px;text-decoration:none">Apply →</a>
    <a href="${GH}profile/applications/${dir}/kit.md" style="font:13px Arial;color:#3E5C2F;margin-left:14px">Full kit: answers, cover letter</a>
    <div style="font:12px Arial;color:#56634F;margin-top:8px">Attached: Hussain_Singapuri_CV_${esc(dir.replace(/^\d+-/, ''))}.pdf (upload to the form) · designed CV · cover letter</div>
  </td></tr><tr><td style="height:12px"></td></tr>`;
}

async function main() {
  if (!PASS) { status('NOT SENT: add the GMAIL_APP_PASSWORD secret in GitHub (Settings → Secrets and variables → Actions).'); return; }
  const nodemailer = (await import('nodemailer')).default;
  const mail = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: FROM, pass: PASS } });

  const kitsDir = path.join(DATA, 'applications');
  const sent = new Set(existsSync(LEDGER) ? readFileSync(LEDGER, 'utf8').split('\n').map(l => l.split('\t')[1]).filter(Boolean) : []);
  const fresh = (existsSync(kitsDir) ? readdirSync(kitsDir) : []).filter(d => existsSync(path.join(kitsDir, d, 'kit.json')) && !sent.has(d)).sort();
  const day = new Date(Date.now() + 330 * 60_000).toUTCString().slice(0, 16);

  if (!fresh.length) {
    if (TEST || SCHEDULED) {
      await mail.sendMail({ from: `Job agent <${FROM}>`, to: TO, subject: TEST ? '✅ Job agent test email' : `Job agent — no new 4.0+ jobs today (${day})`,
        text: TEST ? 'Email delivery works. Every job scoring 4.0+ will arrive like this with the Apply link and your CVs attached.' : `The morning hunt found no new jobs scoring 4.0+ today. Details: ${GH}profile/data/last-run.md` });
      status(TEST ? `OK: test email sent to ${TO}` : `OK: "no new jobs" email sent to ${TO}`);
    } else status('OK: nothing new to send');
    return;
  }

  const jobs = fresh.map(d => {
    const dir = path.join(kitsDir, d);
    const kit = JSON.parse(readFileSync(path.join(dir, 'kit.json'), 'utf8'));
    const ctx = existsSync(path.join(dir, 'context.json')) ? JSON.parse(readFileSync(path.join(dir, 'context.json'), 'utf8')) : {};
    return { d, dir, kit, ctx, score: parseFloat(kit.score || ctx.score) || 0 };
  }).filter(j => j.score >= Number(CFG.kit_min_score ?? 4.0)).sort((a, b) => b.score - a.score);
  if (!jobs.length) { status('OK: nothing new at 4.0+'); return; }

  const attachments = [];
  for (const j of jobs) {
    const name = j.d.replace(/^\d+-/, '');
    const f = j.ctx.files || {};
    if (f.ats_cv && existsSync(path.resolve(REPO, f.ats_cv))) attachments.push({ filename: `Hussain_Singapuri_CV_${name}.pdf`, path: path.resolve(REPO, f.ats_cv) });
    if (f.designed_cv && existsSync(path.resolve(REPO, f.designed_cv))) attachments.push({ filename: `Hussain_Singapuri_Designed_CV_${name}.pdf`, path: path.resolve(REPO, f.designed_cv) });
    if (existsSync(path.join(j.dir, 'cover-letter.pdf'))) attachments.push({ filename: `Hussain_Singapuri_Cover_Letter_${name}.pdf`, path: path.join(j.dir, 'cover-letter.pdf') });
  }

  const html = `<div style="background:#EEF2E6;padding:24px 12px"><table role="presentation" width="100%" style="max-width:640px;margin:0 auto;border-collapse:separate">
    <tr><td style="padding:0 4px 16px"><div style="font:700 24px Georgia,serif;color:#16241A">${jobs.length} job${jobs.length === 1 ? '' : 's'} ready to apply</div>
    <div style="font:13px Arial;color:#56634F;margin-top:4px">${esc(day)} · all scored 4.0+ and passed the ATS and fact checks · Pune or remote (India)</div></td></tr>
    ${TEST ? '<tr><td style="font:13px Arial;color:#3E5C2F;padding:0 4px 12px">✅ This is a test email: delivery works.</td></tr>' : ''}
    ${jobs.map(j => card(j.kit, j.ctx, j.d)).join('')}
    <tr><td style="font:12px/1.5 Arial;color:#56634F;padding:4px">Nothing has been submitted. Open Apply, upload the attached CV for that job, paste answers from the full kit. Summary of the run: <a href="${GH}profile/data/last-run.md" style="color:#3E5C2F">last-run.md</a></td></tr>
  </table></div>`;
  const text = jobs.map(j => `${j.kit.score} — ${j.kit.role} — ${j.kit.company}\nApply: ${j.kit.apply_url || j.ctx.apply_url}\nKit: ${GH}profile/applications/${j.d}/kit.md`).join('\n\n');

  await mail.sendMail({ from: `Job agent <${FROM}>`, to: TO, subject: `${jobs.length} job${jobs.length === 1 ? '' : 's'} scoring 4.0+ ready to apply — ${day}`, html, text, attachments });
  if (!existsSync(LEDGER)) writeFileSync(LEDGER, 'date\tkit\n');
  appendFileSync(LEDGER, jobs.map(j => `${new Date().toISOString().slice(0, 10)}\t${j.d}`).join('\n') + '\n');
  status(`OK: emailed ${jobs.length} job(s) with ${attachments.length} attachments to ${TO}`);
}

main().catch(e => {
  const hint = /535|Username and Password not accepted|Invalid login/i.test(e.message) ? ' — Gmail rejected the login: create a new app password (needs 2-Step Verification on) and paste it into the GMAIL_APP_PASSWORD secret.' : '';
  status(`NOT SENT: ${String(e.message).slice(0, 300)}${hint}`);
  console.log(`::warning::email: ${e.message}`);
});
