# Article Digest -- Hussain Singapuri

Detailed proof points for evaluations, cover letters and interview prep. Every figure here is also stated in cv.md or the project's own README.

## nanoserve — LLM inference engine (github.com/huss2003/nanoserve)
- Built from scratch in Python/PyTorch with a FastAPI OpenAI-compatible streaming API.
- Paged KV cache, prefix caching, continuous batching with preemption, speculative decoding.
- 3.1x throughput over sequential decoding in benchmarks.

## multi-agent-research-crew (github.com/huss2003/multi-agent-research-crew)
- Planner, parallel researchers, writer and verifier agents on a custom DAG orchestrator (Python asyncio, Claude).
- Retries, timeouts, token budgets, claim-level citation checking.

## site-to-agent (github.com/huss2003/site-to-agent)
- Crawler + hybrid BM25 and vector retrieval (pgvector) fused with RRF; answers cite sources.
- SSRF-hardened fetching; eval harness for answer quality.

## ai-lead-receptionist (github.com/huss2003/ai-lead-receptionist)
- Missed-call text-back, SMS (Twilio) and web chat agent (Claude) that qualifies leads and books jobs; owner dashboard (Next.js, Supabase).

## PageForge (pageforge-hazel.vercel.app/abm)
- Account-based marketing pages: brief to branded landing page for one target account.
- AI (Gemini) drafts only from approved facts and the account's public pages; deterministic validator flags unsupported numbers; reviewer signs off claim by claim; events to PostHog and HubSpot. Next.js 16, React 19, Tailwind v4, Sanity, Supabase.

## Portfolio site with real backend (hussain-singapuri.vercel.app)
- Lead pipeline with rate-limited enquiry form (Postgres-backed limit shared across serverless instances), honeypot.
- Booking: free intro calls and a paid Stripe strategy session; slot holds enforced by a partial unique index; confirmation idempotent via return page or signed webhook.
- Admin (scrypt, hashed session tokens), HMAC-signed CRM events, nonce-based CSP, HSTS, JSON-LD SEO, 10 end-to-end API tests.

## Orbital Surplus (orbital-surplus.vercel.app) — fictional brand, Stripe test mode
- three.js store with six procedurally modelled jackets and WebXR / Quick Look AR try-on.
- Stock held in one transaction (UPDATE … WHERE stock >= qty) so only one shopper wins the last unit; idempotent payment confirmation; partial refunds from admin; 9 end-to-end API tests.

## Nightjar & Co. (nightjar-and-co.vercel.app) — fictional brand, Stripe test mode
- Shopify-style section architecture and Shopify-compatible AJAX Cart API on Node/Vercel Functions.
- Faceted collections, gift-box builder with server-checked limits, verified-buyer reviews, transactional stock reservation, Stripe Checkout + refunds, ops admin with sales dashboard.

## Creative front-end work — fictional brands
- Lumen (scroll story, live canvas lens, pinned glass panels), Kilnwood Roasters (GSAP SplitText, pinned horizontal lineup), Cairnmoor (MorphSVG frames, 3D map, reduced-motion version), Lowlight Video Club (three.js VHS deck on hand-written spring physics, WebGL distortion, GPU fallbacks).

## US-based medical-device company (employer confidential) — Full Stack Developer, Mar 2023 – Sep 2026
- Full-stack web applications, internal AI agents, several apps including a CRM.
- Penetration / security testing on 5+ company mobile apps live on Google Play.

## NeuroNetworks AI Ed — CTO & Principal Course Architect, 2026 – Present
- Built neuronetwrks.com (Python static-site generator, Vercel, programmatic SEO).
- Curriculum: 1-year AI Foundation + five 3-year specialisations.
- Designing Neuromind Practical AI Lab (browser IDE + sandbox + AI tutor).
