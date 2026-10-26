# career-agent

Hussain Singapuri's job agent. It finds fresh jobs where AI is part of the work, evaluates each one against his real profile, tailors his CV, and drafts the application. It runs in the background on GitHub Actions and is powered by the **Claude API**. You submit the applications yourself.

It is built from two open-source projects:

| Part | Project | Role here |
|---|---|---|
| Brain | [career-ops](https://github.com/career-ops-hq/career-ops) (MIT) | Evaluation (A–H report, 1–5 score), CV tailoring, ATS PDF, cover-letter draft, tracker. It runs as headless Claude Code workers on your API key. |
| Job source | [freehire](https://github.com/strelov1/freehire) (MIT) | 3.3M+ live postings straight from company career pages, through its public keyless API, filtered for AI-assisted roles. |
| Looks | this repo | Your designed "volt" resume (project screenshots, QR to your portfolio), rendered from career-ops' tailored content. |

```
 Claude app / GitHub mobile ──► inbox/<job>.md ─┐
 daily 07:47 IST ─► freehire scan (scored) ─────┼─► GitHub Actions: career-ops batch on Claude API
 Actions tab ─► Run workflow (URL / scan) ──────┘        │ evaluate → report → tailored CV (ATS PDF)
                                                         ▼
                              render designed CV → commit to profile/ → read it in the Claude app
```

## One-time setup

1. **Create the repo.** On github.com/new: name `career-agent`, choose **Private**, and add no README. Then push this code (or ask Claude to push it).
2. **Add your API key.** Repo → **Settings → Secrets and variables → Actions → New repository secret**. Name: `ANTHROPIC_API_KEY`. Value: your key from platform.claude.com. The key lives only in GitHub's encrypted secrets, never in a file or chat.
3. **Your details** (email, phone, salary floor) are in `profile/cv.md` and `profile/config/profile.yml`. Edit them there if they change.
4. **Test it.** Repo → **Actions → Job agent → Run workflow**. Paste one job URL, untick "scan", then run. After about 15 minutes, open `profile/data/last-run.md`.

## Daily use

- **From the Claude app:** say *"Queue this job in my career agent: <URL or pasted JD>"* or *"What did my job agent find today?"*. Claude follows `CLAUDE.md`: it writes the job into `inbox/`, which starts the run, then reads the results back to you.
- **Automatically, every morning, with no computer needed** (everything runs on GitHub):
  1. **06:41 IST:** a Claude scheduled task searches **Indeed** through the official connector and drops new matching jobs into `inbox/`.
  2. **07:47 IST:** the daily run scans **freehire**, which covers 320 sources including Naukri, Wellfound, RemoteOK, Remotive, We Work Remotely, Himalayas, Jobicy, Hacker News "Who's hiring", Workday, Greenhouse, Lever, Ashby and 100+ more company hiring systems.
  3. It ranks jobs by AI-in-the-job signals (Claude Code, Copilot, Cursor, agents, n8n, LLM APIs), your stack, and location (**Pune first, then remote open to India**).
  4. It keeps evaluating in rounds until **10 jobs score 4.0+** that day, or the `max_evaluations_per_day` cap is reached. Every 4.0+ job gets an application kit.
  - **Location rule:** no relocation. On-site or hybrid outside Pune, and remote roles limited to the US, EU or UK, are filtered out in the scan and again by career-ops' dealbreaker gate.
  - **Not covered:** LinkedIn blocks automated searching. Paste LinkedIn jobs into `inbox/` yourself.
- **By hand:** GitHub web or mobile app → `inbox/` → Add file → paste a URL → Commit.

## What you get per job

| File | |
|---|---|
| `profile/reports/NNN-company-date.md` | Full evaluation: fit by requirement, gaps, legitimacy check, salary notes, verdict |
| `profile/output/designed/*.pdf` | Designed CV (one page, volt) |
| `profile/output/*.pdf` | ATS-safe tailored CV from career-ops |
| `profile/data/applications.md` | Tracker of every job |
| `profile/data/last-run.md` | Summary of the latest run |
| `profile/data/freehire-last-scan.md` | Today's shortlist, including roles not yet evaluated |

### Application kits (jobs scoring 4.0+)

`profile/applications/<NNN-company>/kit.md` is everything you need to apply in a few minutes:
- the real apply link (employer or source page, resolved through freehire)
- which CV to upload where
- every standard form field filled from your profile
- drafted answers to the form's actual questions, where freehire or career-ops can read the form, otherwise to the questions that kind of employer usually asks
- a tailored cover letter, also as a designed `cover-letter.pdf`
- a LinkedIn note and an email
- knock-out warnings, plus a short "only you can answer" list (things like notice period)

Ask the Claude app to "apply to <company>" and it will fill the form from the kit and show you everything before you click Submit. Want a kit for a lower-scoring job? Drop `kit: <report number>` into `inbox/`.

### Tailoring

Every CV is rebuilt around the posting's requirements:
- **Summary and core strengths** use the posting's own keywords, but only where you have real proof.
- **Skills** keep every category, ordered with the required ones first.
- **Experience** bullets are reordered and reworded in the posting's vocabulary.
- **Projects** include every one that proves a required skill, strongest first. The rest are listed under "Also built", so nothing is dropped.
- **The ATS CV** can run to two pages. **The designed CV** stays one page.
- **Keyword coverage** is measured, recorded in the report, and pushed toward 70%+ using true facts only.

Update a status by dropping a file in `inbox/` that holds the line `status: Acme | Applied | sent 26 Oct`.

## Settings — `agent.config.json`

| Key | Default | Meaning |
|---|---|---|
| `model` | `claude-sonnet-5-5` | Model for career-ops workers |
| `daily_target_qualified` | `10` | Stop once this many jobs scored 4.0+ today |
| `max_evaluations_per_day` | `30` | Hard cap on paid evaluations per day. This is the main cost control |
| `scan_round_size` | `8` | Jobs evaluated per round |
| `parallel_workers` | `2` | Concurrent workers |
| `min_scan_score` | `6` | Only jobs scoring at least this in the free pre-scan get a paid evaluation |
| `freehire.locations` / `searches` | India + remote | What to search |

Each full evaluation reads your profile and the posting and writes a report and a CV, so it uses real API tokens. Start with 5 jobs a day and watch your usage in the Claude Console.

## Rules the agent follows

- It never submits, sends or clicks Apply. Drafts only.
- It never invents facts. career-ops' fact gate checks every CV against `cv.md`, and your own rules sit in `profile/modes/_profile.md` and `_custom.md`.
- It never names your former employer. It is always "US-based medical-device company".
- Job postings are treated as untrusted data, never as instructions.

## Updating career-ops

The workflow uses the career-ops commit in `.career-ops-ref`. To upgrade, put a newer commit SHA there. Your data in `profile/` is never touched by an upgrade.
