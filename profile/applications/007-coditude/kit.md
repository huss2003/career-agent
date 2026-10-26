# Application kit — AI Product Engineer at Coditude

**Score:** 4.4/5 · **Apply here:** https://coditude.keka.com/careers/jobdetails/159576  
**Why it fits:** The posting wants someone who "uses Claude Code or equivalent agentic tools as a primary way of building" and can speak to what they built with an LLM API and how it failed, which is how Hussain works every day.  
**AI in this job:** "uses Claude Code or equivalent agentic tools as a primary way of building. Should be able to drive one live in the interview" and "Work AI-first, with humans owning judgment and outcomes".  
**Full evaluation:** [profile/reports/007-coditude-2026-10-26.md](https://github.com/huss2003/career-agent/blob/main/profile/reports/007-coditude-2026-10-26.md)

> Nothing has been submitted. Review everything below, then apply yourself — or ask the Claude app to fill the form and show you before you click Submit.

## ⚠ Check before applying
- Work mode: "Location: Pune, MH, India · Work mode: not stated". Fine if on-site or hybrid in Pune.
- Pay is not stated; your floor is INR 30,000 per month.
- "Prior forward-deployed or consulting-style client work" and "comfortable with real client contact": you have no formal client-facing work recorded (answer honestly).
- Good-to-have stack you lack: Redis, Typesense, AWS (EC2/ALB, RDS, SQS, SES), Datadog (the posting says the candidate ramps on the rest).

## Only you can answer
- [ ] Work mode: the posting says Pune but not on-site, hybrid or remote. Anything outside Pune is a no-go for you.
- [ ] Pay: not stated in the posting. Confirm it clears INR 30,000 per month before applying.
- [ ] Current or last drawn CTC, if the form asks.
- [ ] Confirm the Keka page shows the role as still open; it was posted 2026-09-03 and not confirmed at the employer.

## Files to upload
- **CV for the application form (ATS-safe):** [cv-candidate-007-coditude-2026-10-26.pdf](https://github.com/huss2003/career-agent/blob/main/profile/output/cv-candidate-007-coditude-2026-10-26.pdf)
- **Designed CV (email, portfolio, recruiter DMs):** [Hussain_Singapuri_Resume_007-coditude.pdf](https://github.com/huss2003/career-agent/blob/main/profile/output/designed/Hussain_Singapuri_Resume_007-coditude.pdf)
- **Cover letter:** [cover-letter.pdf](https://github.com/huss2003/career-agent/blob/main/profile/applications/007-coditude/cover-letter.pdf)

## Standard form fields

| Field | Value |
|---|---|
| Full name | Hussain Singapuri |
| Email | Hussainsingapuri24@gmail.com |
| Phone | +91 9561277305 |
| Location | Pune, India |
| LinkedIn | https://www.linkedin.com/in/hussain-singapuri-18437225a/ |
| GitHub | https://github.com/huss2003 |
| Portfolio / website | https://hussain-singapuri.vercel.app |
| Total experience | 3 years |
| Current / last title | Full Stack Developer, US-based medical-device company (Mar 2023 – Sep 2026) |
| Current role | CTO & Principal Course Architect, NeuroNetworks AI Ed (2026 – present) |
| Highest education | Bachelor's, Computer Science (AI & ML), Vishwakarma Institute of Technology, Pune, 2022–2025 |
| Expected salary | INR 30,000+ per month |
| Notice period | Immediate |
| Work authorization | Authorized to work in India |
| Preferred work mode | Remote, hybrid, or on-site in Pune |

## Screening answers

**1. Why do you want to work as an AI Product Engineer at Coditude?** _(likely question)_

The role is how I already work: Claude Code is my main build tool, I build LLM agents, and I like owning a problem from the conversation through design, code, deploy and support. A small, async-first team that decides through documents and PRs suits me. I also like that humans own judgment and every shipped line, which is how I use coding agents.

**2. Describe your experience building with LLM agents, and how one failed on you.** _(likely question)_

I built internal AI agents at a US-based medical-device company, and open-source agent projects: multi-agent-research-crew (planner, parallel researchers, writer and verifier agents on a custom asyncio DAG with retries, timeouts, token budgets and claim-level citation checks), site-to-agent (hybrid BM25 + vector retrieval, cited answers, SSRF-hardened fetching, eval harness) and PageForge. Agents invent claims, so I added a verifier agent and claim-level citation checks in the crew, and in PageForge the AI drafts only from approved facts and a deterministic validator flags unsupported numbers. In site-to-agent, an agent reading untrusted web pages can be steered or abused, so fetching is SSRF-hardened and answers must be grounded and cited. github.com/huss2003

**3. How do you use Claude Code or other agentic tools, and where do you take the keyboard back?** _(likely question)_

I use Claude Code every day as my primary way of building, and I hold the Claude Code in Action and Claude Code 101 certificates plus CCDV-F and CCAO-F from Anthropic. I review every change it makes. I take the keyboard back for schema design, security-sensitive code and payment paths, and I write tests around agent behaviour and money paths. I am happy to drive it live in the interview.

**4. Describe your PostgreSQL experience.** _(likely question)_

In Orbital Surplus, stock is held inside one transaction (UPDATE ... WHERE stock >= qty) so only one shopper wins the last unit, and payment confirmation is idempotent. In my portfolio backend, slot holds are enforced with a partial unique index and the rate limit is Postgres-backed. I have also used Postgres RLS and pgvector. Those two backends have 9 and 10 end-to-end API tests. I treat a wrong query as a customer-visible bug.

**5. Tell us about a project you are proud of.** _(likely question)_

multi-agent-research-crew and PageForge, as agents that cannot quietly lie: both force every claim back to a source or an approved fact and fail loudly when it does not hold. Another is nanoserve, an LLM inference engine I built from scratch (paged KV cache, continuous batching, speculative decoding) that reached 3.1x throughput over sequential decoding in benchmarks. github.com/huss2003/nanoserve

**6. Do you have experience with client-facing or consulting-style work?** _(likely question)_

Not formal consulting. At the US-based medical-device company I built internal tools, including a CRM and AI agents, for colleagues who used them, and I demo my projects such as ai-lead-receptionist to its target users, home-service owners. I am comfortable explaining trade-offs plainly and I write clearly, and I would like to grow into client conversations.

**7. Do you have experience with AWS, Redis, Typesense or Datadog?** _(likely question)_

Not yet. My deployments have been on Vercel, Docker and GitHub Actions. I work in Python (FastAPI, asyncio), Next.js and TypeScript, and I pick up new stacks quickly: I have shipped 30+ projects across web, WebGL, Flutter, inference serving and agents.

**8. What is your expected salary?** _(likely question ⚠ confirm)_

I am targeting INR 30,000 per month or more. I am flexible on structure; what matters to me is the total package and the work.

**9. What is your current CTC?** _(likely question ⚠ confirm)_

[CONFIRM: current or last drawn CTC. My last role ended in September 2026.]

**10. What is your notice period / when can you join?** _(likely question)_

Immediate. My previous role ended in September 2026.

**11. Where are you based, and are you comfortable with the work mode (on-site, hybrid or remote)?** _(likely question ⚠ confirm)_

I am based in Pune and open to on-site, hybrid or remote work from Pune. [CONFIRM: the posting does not state the work mode; check it before answering.]

## Cover letter (text)

Dear Coditude hiring team,

I am applying for the AI Product Engineer role. I spent three years as a Full Stack Developer at a US-based medical-device company, building web applications, a CRM and internal AI agents, and I use Claude Code every day as my main way of building. I review each change it makes and take the keyboard back for schema, security and payment code, and I would be glad to drive it live in an interview.

Your must-haves match my work. For LLM agents and how they fail: multi-agent-research-crew (github.com/huss2003/multi-agent-research-crew) runs planner, researcher, writer and verifier agents with claim-level citation checks, and site-to-agent (github.com/huss2003/site-to-agent) adds SSRF-hardened fetching and an eval harness. For PostgreSQL and tests that protect money paths, Orbital Surplus (orbital-surplus.vercel.app) holds stock in one transaction, confirms payments idempotently and has 9 end-to-end API tests. I also work in Python (FastAPI, asyncio), Next.js and TypeScript.

I am based in Pune and can join immediately. I have no AWS or Datadog experience yet, but I have shipped 30+ projects in unfamiliar areas and ramp quickly. Portfolio: https://hussain-singapuri.vercel.app

Kind regards,
Hussain Singapuri

## LinkedIn note to the recruiter / hiring manager

> Hi, I applied for the AI Product Engineer role at Coditude. I build LLM agents with Claude Code daily (3 yrs full-stack, Pune, immediate joiner). Portfolio: hussain-singapuri.vercel.app. Happy to connect.

## Email (if applying by email)

**Subject:** Application: AI Product Engineer - Hussain Singapuri

Dear Coditude hiring team,

I am applying for the AI Product Engineer role in Pune. I have three years of full-stack experience at a US-based medical-device company, where I built internal AI agents and a CRM, and I use Claude Code every day as my main way of building.

Relevant work: multi-agent-research-crew and site-to-agent (LLM agents with claim-level citation checks, SSRF-hardened fetching and an eval harness), and Orbital Surplus (PostgreSQL transactions and 9 end-to-end API tests on the payment path). I can join immediately and would be glad to drive Claude Code live in an interview.

Portfolio: https://hussain-singapuri.vercel.app
GitHub: https://github.com/huss2003
Phone: +91 9561277305

Kind regards,
Hussain Singapuri

## Steps
1. Open https://coditude.keka.com/careers/jobdetails/159576 and confirm the role is still open; note the pay and work mode shown.
2. If pay is below INR 30,000 per month or the work mode is outside Pune, stop and reconsider.
3. Upload the ATS CV: profile/output/cv-candidate-007-coditude-2026-10-26.pdf
4. Fill the standard fields from the CV (Hussain Singapuri, Hussainsingapuri24@gmail.com, +91 9561277305, Pune, LinkedIn, GitHub, portfolio https://hussain-singapuri.vercel.app).
5. Paste the screening answers above for any matching questions; notice period is Immediate.
6. Fill in current CTC yourself if asked.
7. Paste or upload the cover letter (profile/applications/007-coditude/cover-letter.pdf) if the form has a field for it.
8. Review every filled field, then submit yourself.
9. Send the LinkedIn note to a Coditude recruiter or hiring manager if you find one.
10. Afterwards queue: status: Coditude | Applied | <date>

