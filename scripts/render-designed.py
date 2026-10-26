#!/usr/bin/env python3
"""
render-designed.py — render Hussain's designed (volt) resume from career-ops' tailored CV payloads.

career-ops tailors the CV for each job and, per modes/_custom.md, saves the final render payload to
profile/output/payloads/cv-{report}-{company}.json. This script turns every payload that has no designed
PDF yet into profile/output/designed/<name>_Resume_<report>-<company>.pdf, using the same tailored
content (no LLM call, no new facts). career-ops' own PDF stays the ATS version.

Usage: python scripts/render-designed.py [--all] [--theme volt|sage|slate|clay] [payload.json ...]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from pypdf import PdfReader

REPO = Path(__file__).resolve().parent.parent
RESUME = REPO / "resume"
ASSETS = RESUME / "assets"
DATA = REPO / "profile"
PAYLOADS = DATA / "output" / "payloads"
OUT = DATA / "output" / "designed"
DESIGN = json.loads((RESUME / "design.json").read_text(encoding="utf-8"))
FONT_SIZES = [9.4, 9.1, 8.8, 8.5]

JINJA = Environment(loader=FileSystemLoader(RESUME / "templates"), autoescape=select_autoescape(["html"]))


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()


def strip_md(s: str) -> str:
    return re.sub(r"\*\*(.+?)\*\*", r"\1", str(s or ""))


def as_list(v) -> list[str]:
    if isinstance(v, list):
        return [strip_md(x).strip() for x in v if str(x).strip()]
    return [strip_md(x).strip() for x in str(v or "").split(",") if x.strip()]


def image_for(name: str) -> str | None:
    n = norm(name)
    for key, rel in DESIGN["project_images"].items():
        if n.startswith(norm(key)):
            p = RESUME / rel
            if p.exists():
                return p.resolve().as_uri()
    return None


def link_of(field) -> str:
    if isinstance(field, dict):
        return field.get("url", "")
    return str(field or "")


def to_context(payload: dict) -> dict:
    """Map career-ops' payload schema (modes/pdf.md → JSON Input Schema) to the designed template."""
    c = payload.get("candidate", {})
    contact = {
        "name": c.get("name", "Hussain Singapuri"),
        "email": c.get("email", ""),
        "phone": c.get("phone", ""),
        "location": c.get("location", ""),
        "portfolio": link_of(c.get("portfolio")) or "https://hussain-singapuri.vercel.app",
        "github": link_of(c.get("github")) or "https://github.com/huss2003",
        "linkedin": link_of(c.get("linkedin")),
    }
    skills = [{"category": s.get("category") or "Skills", "items": as_list(s.get("items"))[:6]} for s in payload.get("skills", [])]
    comps = as_list(payload.get("competencies", []))
    if comps:
        skills.insert(0, {"category": "Core strengths", "items": comps[:6]})
    seen: set[str] = set()
    for group in skills:  # a skill shown once is enough
        group["items"] = [i for i in group["items"] if not (norm(i) in seen or seen.add(norm(i)))]
    skills = [g for g in skills if g["items"]][:5]

    experience = [{
        "title": strip_md(e.get("role", "")),
        "organization": strip_md(e.get("company", "")),
        "location": e.get("location", ""),
        "dates": e.get("dates") or e.get("period", ""),
        "bullets": [strip_md(b) for b in e.get("bullets", [])],
    } for e in payload.get("experience", [])]

    projects, also = [], ""
    for p in payload.get("projects", []):
        desc = p.get("description") or " ".join(p.get("bullets", []))
        if norm(p.get("name", "")) in ("more projects", "other projects"):
            also = strip_md(desc)  # the "nothing is lost" line from _custom.md rule 6
            continue
        projects.append({
            "name": strip_md(p.get("name", "")),
            "link": p.get("url", ""),
            "stack": p.get("tech", ""),
            "bullets": [strip_md(desc)] if desc else [],
            "image": image_for(p.get("name", "")),
        })

    education = [{"degree": e.get("title", ""), "institution": e.get("org", ""), "dates": e.get("year", "")}
                 for e in payload.get("education", [])]
    certs = [c2.get("title", "") if isinstance(c2, dict) else str(c2) for c2 in payload.get("certifications", [])]

    resume = {
        "headline": c.get("title") or "Software developer turned AI engineer",
        "summary": strip_md(payload.get("summary", "")),
        "highlights": DESIGN["highlights"],
        "skills": skills,
        "experience": experience,
        "projects": projects,
        "education": education,
        "certifications": certs,
        "also": also,
    }
    return {"contact": contact, "resume": resume}


def load_icons() -> dict:
    icons = {}
    for f in (ASSETS / "icons").glob("*.svg"):
        svg = re.sub(r"<!--.*?-->", "", f.read_text(encoding="utf-8"), flags=re.S)
        svg = re.sub(r"<svg\b[^>]*>", lambda m: re.sub(r'\s(width|height)="\d+"', "", m.group(0)), svg, count=1)
        icons[f.stem] = svg.strip()
    return icons


def qr_svg(url: str, color: str) -> str:
    import qrcode
    qr = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(url)
    qr.make(fit=True)
    m = qr.get_matrix()
    d = "".join(f"M{x} {y}h1v1h-1z" for y, row in enumerate(m) for x, v in enumerate(row) if v)
    return f'<svg viewBox="0 0 {len(m)} {len(m)}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><path fill="{color}" d="{d}"/></svg>'


def render(page, payload_path: Path, theme: str) -> tuple[Path, int]:
    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    ctx = to_context(payload)
    t = DESIGN["themes"].get(theme, DESIGN["themes"]["volt"])
    photo = next((p.resolve().as_uri() for p in (ASSETS / f"photo.{e}" for e in ("jpg", "jpeg", "png", "webp")) if p.exists()), None)
    base = {
        **ctx, "job": {"company": payload_path.stem},
        "assets": ASSETS.resolve().as_uri(), "theme": t, "icons": load_icons(),
        "qr_svg": qr_svg(ctx["contact"]["portfolio"], t["band_ink"]), "photo": photo,
        "initials": "".join(w[0] for w in ctx["contact"]["name"].split()[:2]).upper(),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    stem = payload_path.stem[3:] if payload_path.stem.startswith("cv-") else payload_path.stem
    out = OUT / f"{ctx['contact']['name'].replace(' ', '_')}_Resume_{stem}.pdf"
    html_path = out.with_suffix(".html")

    projects = ctx["resume"]["projects"]
    exp = ctx["resume"]["experience"]
    # Fit to one page: shrink type first, then trim the compact project list, then long bullet lists.
    plans = [(len(projects), 99), (min(len(projects), 4), 99), (min(len(projects), 4), 3), (3, 3), (3, 2)]
    pages = 99
    for keep_projects, max_bullets in plans:
        trimmed = {**ctx["resume"], "projects": projects[:keep_projects],
                   "experience": [{**e, "bullets": e["bullets"][:max_bullets]} for e in exp]}
        feat = trimmed["projects"][:3]
        more = trimmed["projects"][3:]
        for fs in FONT_SIZES:
            html_path.write_text(JINJA.get_template("signature.html").render(
                **{**base, "resume": trimmed}, featured=feat, more=more, font_size=fs), encoding="utf-8")
            page.goto(html_path.resolve().as_uri(), wait_until="load")
            page.evaluate("document.fonts.ready")
            page.pdf(path=str(out), format="A4", print_background=True, prefer_css_page_size=True)
            pages = len(PdfReader(str(out)).pages)
            if pages == 1:
                break
        if pages == 1:
            break
    html_path.unlink(missing_ok=True)
    return out, pages


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("payloads", nargs="*")
    ap.add_argument("--all", action="store_true", help="Re-render even when a designed PDF already exists")
    ap.add_argument("--theme", default=DESIGN.get("theme", "volt"))
    a = ap.parse_args()

    todo = [Path(p) for p in a.payloads] or sorted(PAYLOADS.glob("*.json"))
    if not a.all and not a.payloads:
        done = {p.stem for p in OUT.glob("*.pdf")} if OUT.exists() else set()
        todo = [p for p in todo if not any(d.endswith(p.stem[3:] if p.stem.startswith("cv-") else p.stem) for d in done)]
    if not todo:
        print("designed: nothing new to render")
        return
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page()
        for p in todo:
            try:
                out, pages = render(page, p, a.theme)
                print(f"designed: {out.relative_to(REPO)} ({pages} page)")
            except Exception as e:  # one bad payload must not stop the rest
                print(f"designed: FAILED {p.name}: {e}", file=sys.stderr)
        browser.close()


if __name__ == "__main__":
    main()
