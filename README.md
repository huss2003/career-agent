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
3. **Fill your details** in `profile/cv.md` and `profile/config/profile.yml`. Replace `[FILL YOUR EMAIL]`, `[FILL YOUR PHONE]` and the salary `target_range`.
4. **Test it.** Repo → **Actions → Job agent → Run workflow**. Paste one job URL, untick "scan", then run. After about 15 minutes, open `profile/data/last-run.md`.

## Daily use

- **From the Claude app:** say *"Queue this job in my career agent: <URL or pasted JD>"* or *"What did my job agent find today?"*. Claude follows `CLAUDE.md`: it writes the job into `inbox/`, which starts the run, then reads the results back to you.
- **Automatically:** every morning it scans freehire for new roles in India and remote roles. It scores them for AI-in-the-job signals (Claude Code, Copilot, Cursor, agents, n8n, LLM APIs) and your stack, then fully evaluates the top `jobs_per_run`.
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

Update a status by dropping a file in `inbox/` that holds the line `status: Acme | Applied | sent 26 Oct`.

## Settings — `agent.config.json`

| Key | Default | Meaning |
|---|---|---|
| `model` | `claude-sonnet-5-5` | Model for career-ops workers |
| `jobs_per_run` | `5` | How many scanned jobs to fully evaluate per daily run. This is the main cost control |
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
