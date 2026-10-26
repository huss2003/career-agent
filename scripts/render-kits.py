#!/usr/bin/env python3
"""
render-kits.py — turn each profile/applications/<NNN-company>/kit.json into:
  kit.md            everything needed to apply: link, files, form fields, answers, cover letter, notes
  cover-letter.pdf  designed cover letter (same volt identity as the resume)

Standard form fields (name, email, phone, links, location, experience, education, salary) come from
profile/config/profile.yml and fixed facts — never from the model.

Usage: python scripts/render-kits.py [--all]
"""
from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape

REPO = Path(__file__).resolve().parent.parent
DATA = REPO / "profile"
KITS = DATA / "applications"
RESUME = REPO / "resume"
DESIGN = json.loads((RESUME / "design.json").read_text(encoding="utf-8"))
JINJA = Environment(loader=FileSystemLoader(RESUME / "templates"), autoescape=select_autoescape(["html"]))
GH = "https://github.com/huss2003/career-agent/blob/main/"


def profile() -> dict:
    p = yaml.safe_load((DATA / "config" / "profile.yml").read_text(encoding="utf-8")) or {}
    c = p.get("candidate", {})
    comp = p.get("compensation", {})
    return {
        "name": c.get("full_name", "Hussain Singapuri"),
        "email": c.get("email", ""),
        "phone": c.get("phone", ""),
        "location": c.get("location", "Pune, India"),
        "linkedin": c.get("linkedin", ""),
        "github": c.get("github", "https://github.com/huss2003"),
        "portfolio": c.get("portfolio_url", "https://hussain-singapuri.vercel.app"),
        "salary": comp.get("target_range", ""),
    }


def standard_fields(c: dict) -> list[tuple[str, str]]:
    return [
        ("Full name", c["name"]), ("Email", c["email"]), ("Phone", c["phone"]), ("Location", c["location"]),
        ("LinkedIn", c["linkedin"]), ("GitHub", c["github"]), ("Portfolio / website", c["portfolio"]),
        ("Total experience", "3 years"),
        ("Current / last title", "Full Stack Developer, US-based medical-device company (Mar 2023 – Sep 2026)"),
        ("Current role", "CTO & Principal Course Architect, NeuroNetworks AI Ed (2026 – present)"),
        ("Highest education", "Bachelor's, Computer Science (AI & ML), Vishwakarma Institute of Technology, Pune, 2022–2025"),
        ("Expected salary", c["salary"] or "[CONFIRM]"),
        ("Notice period", "Immediate"),
        ("Work authorization", "Authorized to work in India"),
        ("Preferred work mode", "Remote, hybrid, or on-site in Pune"),
    ]


def md_escape(s: str) -> str:
    return str(s or "").replace("|", "/")


def write_md(kit: dict, ctx: dict, c: dict, folder: Path, cover_pdf: str | None) -> None:
    files = ctx.get("files", {})
    L = [f"# Application kit — {kit.get('role', ctx.get('role'))} at {kit.get('company', ctx.get('company'))}", ""]
    L += [f"**Score:** {kit.get('score', ctx.get('score'))} · **Apply here:** {kit.get('apply_url') or ctx.get('apply_url')}  ",
          f"**Why it fits:** {kit.get('fit_line', '')}  ", f"**AI in this job:** {kit.get('ai_in_job', 'not stated')}  ",
          f"**Full evaluation:** [{ctx.get('report')}]({GH}{ctx.get('report')})", ""]
    L += ["> Nothing has been submitted. Review everything below, then apply yourself — or ask the Claude app to fill the form and show you before you click Submit.", ""]

    if kit.get("knockout_warnings"):
        L += ["## ⚠ Check before applying", *[f"- {w}" for w in kit["knockout_warnings"]], ""]
    if kit.get("needs_you"):
        L += ["## Only you can answer", *[f"- [ ] {n}" for n in kit["needs_you"]], ""]

    L += ["## Files to upload"]
    if files.get("ats_cv"):
        L.append(f"- **CV for the application form (ATS-safe):** [{Path(files['ats_cv']).name}]({GH}{files['ats_cv']})")
    if files.get("designed_cv"):
        L.append(f"- **Designed CV (email, portfolio, recruiter DMs):** [{Path(files['designed_cv']).name}]({GH}{files['designed_cv']})")
    if cover_pdf:
        L.append(f"- **Cover letter:** [cover-letter.pdf]({GH}{cover_pdf})")
    L += ["", "## Standard form fields", "", "| Field | Value |", "|---|---|"]
    L += [f"| {k} | {md_escape(v)} |" for k, v in standard_fields(c)]

    L += ["", "## Screening answers", ""]
    for i, q in enumerate(kit.get("screening_answers", []), 1):
        flag = " ⚠ confirm" if q.get("needs_you") else ""
        L += [f"**{i}. {q.get('question', '')}** _({q.get('source', '')}{flag})_", "", q.get("answer", ""), ""]

    cl = kit.get("cover_letter") or {}
    if cl:
        L += ["## Cover letter (text)", "", cl.get("greeting", ""), "", *[p + "\n" for p in cl.get("paragraphs", [])], cl.get("sign_off", ""), c["name"], ""]
    if kit.get("recruiter_note"):
        L += ["## LinkedIn note to the recruiter / hiring manager", "", f"> {kit['recruiter_note']}", ""]
    em = kit.get("email") or {}
    if em.get("body"):
        L += ["## Email (if applying by email)", "", f"**Subject:** {em.get('subject', '')}", "", em["body"], ""]
    if kit.get("checklist"):
        L += ["## Steps", *[f"{i}. {s}" for i, s in enumerate(kit["checklist"], 1)], ""]
    (folder / "kit.md").write_text("\n".join(L) + "\n", encoding="utf-8")


def render_cover(page, kit: dict, c: dict, folder: Path) -> str | None:
    cl = kit.get("cover_letter") or {}
    if not cl.get("paragraphs"):
        return None
    theme = DESIGN["themes"].get(DESIGN.get("theme", "volt"))
    html = JINJA.get_template("cover_letter.html").render(
        contact={"name": c["name"], "email": c["email"], "phone": c["phone"], "portfolio": c["portfolio"]},
        job={"company": kit.get("company", ""), "role": kit.get("role", "")},
        cover_letter=cl, today=dt.date.today().strftime("%d %B %Y"),
        assets=(RESUME / "assets").resolve().as_uri(), theme=theme)
    src = folder / "cover-letter.html"
    src.write_text(html, encoding="utf-8")
    page.goto(src.resolve().as_uri(), wait_until="load")
    page.evaluate("document.fonts.ready")
    out = folder / "cover-letter.pdf"
    page.pdf(path=str(out), format="A4", print_background=True, prefer_css_page_size=True)
    src.unlink()
    return str(out.relative_to(REPO))


def main():
    redo = "--all" in sys.argv
    todo = [k for k in sorted(KITS.glob("*/kit.json")) if redo or not (k.parent / "kit.md").exists()] if KITS.exists() else []
    if not todo:
        print("kits: nothing to render")
        return
    c = profile()
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        for k in todo:
            try:
                kit = json.loads(k.read_text(encoding="utf-8"))
                ctx_path = k.parent / "context.json"
                ctx = json.loads(ctx_path.read_text(encoding="utf-8")) if ctx_path.exists() else {}
                pdf = render_cover(page, kit, c, k.parent)
                write_md(kit, ctx, c, k.parent, pdf)
                print(f"kits: {k.parent.relative_to(REPO)}/kit.md")
            except Exception as e:
                print(f"kits: FAILED {k}: {e}", file=sys.stderr)
        browser.close()


if __name__ == "__main__":
    main()
