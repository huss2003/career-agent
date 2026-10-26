# Custom Instructions -- career-ops

<!-- THIS FILE IS YOURS. Never auto-updated. Procedural house rules. -->

## House Rules

- Every run of this setup is an unattended GitHub Actions run (headless `claude -p` workers). Never wait for a human answer; follow the `Unattended runs` rules in `modes/_shared.md`.
- Spelling: follow the posting's spelling (Indian/UK English by default).
- The CV PDF uses page_format `a4` unless the posting is clearly US-based.
- **Candidate slug:** `{candidate}` in every output filename is `hussain-singapuri` (profile.yml stores the name under `candidate.full_name`).
- **freehire jobs:** for a `https://freehire.me/jobs/<slug>` URL, the clean job description is saved at `jds/freehire-<slug>.md` in the data root. Use that file as the JD text, and archive ITS text verbatim under `## Job Description (archived verbatim)`. The fetched freehire web page contains navigation and "similar jobs" clutter: never archive or evaluate that clutter. The file's "Apply (source)" line is the employer/source posting.
- **Save the render payload.** In `pdf` / batch PDF generation, after the final payload is built (Step 17, after any rewrites), also copy it to `output/payloads/cv-{report}-{company-slug}.json` (create the folder if missing). A downstream step renders Hussain's designed resume from that file. Copy the file only; never change its content for this.
- Draft a cover letter for every role scoring 4.0/5 or higher.

## CV tailoring rules (every payload)

Goal: the CV must read as a direct answer to THIS posting's requirements, while staying 100% true to `cv.md` and `article-digest.md`.

1. **Requirement map first.** Before writing the payload, list the posting's required and preferred skills/tools in the posting's own wording. For each, find the evidence in cv.md / article-digest.md (a role bullet, a project, a skill). Requirements with no evidence stay off the CV and go to the report's gaps.
2. **Summary (3–4 lines):** open with the posting's role title when truthful, then the 3–4 requirements Hussain matches most strongly, in the posting's words, each tied to proof (the medtech role, a named project, a certification). Always state "3 years" of professional experience.
3. **competencies[] (6–8):** the posting's own keywords that Hussain genuinely has, in the posting's spelling (e.g. "Agentic AI", "n8n", "Next.js", "RAG"). Most important first.
4. **skills[]:** keep EVERY category from cv.md (all details stay), but reorder categories and items so the posting's required skills come first; use the posting's spelling for the same skill.
5. **experience[]:** keep both roles and every fact. Reorder bullets so the ones proving required skills come first, and reword them with the posting's vocabulary where the meaning is identical. Never upgrade titles or add metrics.
6. **projects[]:** include EVERY cv.md project that proves at least one required or preferred skill, most relevant first. The first three are shown as picture cards on the designed resume, so pick those as the strongest proof. For each, write the description around the required skills it demonstrates and keep its link. Use the project names exactly as written in bold in cv.md.
   Then add one final entry: `{"name": "More projects", "description": "<comma-separated names of the cv.md projects not listed above>", "url": "https://github.com/huss2003"}` so nothing is lost.
7. **certifications[]:** all five, the most relevant to the posting first.
8. Pass `--max-pages=2` to generate-pdf.mjs: the ATS CV may use up to two pages to carry every relevant project. The designed resume is a separate one-page render.
9. After rendering, run `node keyword-match.mjs reports/<report file> --cv <tailored CV .html>` and record the keyword coverage % in the report under a line `**Keyword coverage:** NN%`. If coverage is under 70%, revisit steps 2–6 once (only with true facts), then re-render.

## Output Preferences

- Reports: lead with the score and the one-line verdict, then a one-line "AI in this job" note: how the posting says AI/coding agents/LLMs are used in the role (quote the JD), or "not stated".

## Off-Limits

- Never submit, send or click Apply on anything. Drafts only; Hussain submits himself.
- Never name the former medtech employer.
- Never invent metrics, employers, clients, certifications or dates.
