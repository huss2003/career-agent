# Custom Instructions -- career-ops

<!-- THIS FILE IS YOURS. Never auto-updated. Procedural house rules. -->

## House Rules

- Every run of this setup is an unattended GitHub Actions run (headless `claude -p` workers). Never wait for a human answer; follow the `Unattended runs` rules in `modes/_shared.md`.
- Spelling: follow the posting's spelling (Indian/UK English by default).
- The CV PDF uses page_format `a4` unless the posting is clearly US-based.
- **Save the render payload.** In `pdf` / batch PDF generation, after the final payload is built (Step 17, after any rewrites), also copy it to `output/payloads/cv-{report}-{company-slug}.json` (create the folder if missing). A downstream step renders Hussain's designed resume from that file. Copy the file only; never change its content for this.
- In every CV payload, put the 3–5 projects most relevant to the posting first in `projects[]`; the first three are shown as picture cards on the designed resume. Use the project names exactly as written in bold in `cv.md`.
- Draft a cover letter for every role scoring 4.0/5 or higher.

## Output Preferences

- Reports: lead with the score and the one-line verdict, then a one-line "AI in this job" note: how the posting says AI/coding agents/LLMs are used in the role (quote the JD), or "not stated".

## Off-Limits

- Never submit, send or click Apply on anything. Drafts only; Hussain submits himself.
- Never name the former medtech employer.
- Never invent metrics, employers, clients, certifications or dates.
