# Overlay

Files here are copied over the fresh career-ops checkout in every workflow run (system layer only, never your data).

- `templates/cv-template.html`: career-ops base CV template with the unused GDPR consent footer removed. The footer's `display:none` rule made `verify-ats.mjs` flag "possible hidden text" (95/100); without it CVs score 100/100. Re-copy from upstream when you bump `.career-ops-ref`.
