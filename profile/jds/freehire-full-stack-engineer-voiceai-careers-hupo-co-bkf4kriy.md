# Full Stack Engineer - VoiceAI — careers.hupo.co

Posted: 2026-07-22
Location: New Delhi, IN · Work mode: remote
Apply (source): https://careers.hupo.co/jobs/8105988-full-stack-engineer-voiceai?utm_source=freehire.me
freehire page: https://freehire.me/jobs/full-stack-engineer-voiceai-careers-hupo-co-bkf4kriy

### About Hupo

We are an AI-native start-up building sales enablement products in the banking, financial services, and insurance industry; already trusted by **dozens of enterprise customers** (including Fortune 500 companies).

### Role at a Glance

> **Title:** Senior Full Stack Engineer - AI Products  
> **Team:** Engineering  
> **Employment Type:** Full-time  
> **Location:** Singapore, Europe, the USA - with a good overlap with Singapore working hours

# **What we do**

We build AI products for the people who sell insurance and banking products across Asia. An advisor can practise a hard client conversation against an AI persona, get a nudge during a live call, or have an AI agent make the first call for them. Our clients are big, regulated, and spread across markets and languages - which means the interesting problems are latency, reliability, testing things that are not deterministic, security that satisfies a bank, and making an AI sound natural in Thai or Cantonese, not just English.

# **Why this role exists**

Our products talk. An advisor practises a pitch against an AI customer; a live call gets a real-time nudge; an AI agent phones someone and holds a conversation. Underneath all of that is a voice path - streaming audio in, speech-to-text, a language model, text-to-speech, audio out - running across languages including Thai, Bahasa Indonesia, Cantonese, Mandarin, Vietnamese and English.

Right now that path is not one thing. Different products built it slightly differently, provider choices were made case by case, and when we add a language the quality check is whoever on the team happens to speak it. We want a senior engineer to own the voice path properly: turn-taking, interruptions, latency, which provider we use for which language and why, monitoring, and what happens when a provider has a bad day. And we want adding a language to be a process with test data and acceptance criteria, so provider and configuration changes can be evaluated consistently. You would work closely with the engineers who own our voice-enabled products and build reusable voice capabilities that more than one product team can adopt. This is product engineering, not research - we evaluate and integrate models, we do not train them.

# **What you would actually do**

- Design, build and run low-latency voice and real-time services.
- Put streaming speech-to-text, language-model and text-to-speech providers behind a clean, configurable architecture.
- Make turn detection, interruption handling, latency, conversation state and provider failover work well - and keep them working.
- Build the framework that tells us which provider is better for a given language: accuracy, latency, cost, and how it actually sounds.
- Turn recordings and transcripts from native speakers into regression tests that run whenever a provider, prompt or configuration changes.
- Get language, provider and tenant configuration under version control so it is reviewable and the same in every environment.
- Add monitoring that catches a tenant routed to the wrong agent, a degraded provider or a failed conversation before a client tells us.
- Build shared, documented voice capabilities that our products can adopt, without interrupting what we have promised clients.
- Run and write up incidents on the voice path, and turn what you find into permanent fixes.
- Work with Product and QA to define what good voice quality means for a language and a use case.

### **First three months**

- **Month one:** own the regression set for one language and the map of what actually runs in each environment; become second owner on one voice service.
- **Month two:** provider benchmark harness working for at least two languages; a consolidation step agreed with the Agentic and Realtime owners.
- **Month three:** that step delivered and adopted by more than one product; a written procedure for onboarding a language, used once for real; you are on the escalation roster for voice incidents.

### **What we need from you**

- 5 or more years building and running production backend or full-stack systems, with at least two on voice, audio, communications or something else where latency really matters.
- Strong production experience in Python, Go or another language you have used for real-time services, and the ability to work well in TypeScript and Node.js. Our voice services are Python; the platform around them is TypeScript.
- WebRTC, LiveKit or a comparable real-time framework, in production.
- You have integrated speech-to-text or text-to-speech providers - more than one, ideally - and you have a concrete view of where each one falls over.
- You understand streaming systems properly: async processing, latency budgets, retries, timeouts, failure modes.
- You have tested something non-deterministic and used the numbers to make a decision.
- You own what you ship: monitoring, on-call, incidents, follow-through.
- You can drop into a codebase you did not write, find the riskiest thing, and fix it without waiting for a rewrite.
- You write clearly, because this team is spread across three time zones.

### **Nice if you have**

- Worked on speech in Asian languages - tonal languages, code-switching, transliterating names and product terms.
- Contact-centre software, conversational AI, telephony or in-call assistance.
- LLM orchestration, prompt versioning, evaluation frameworks or agentic systems.
- Audio-quality measurement or native-speaker testing programmes.
- Got several product teams to adopt a shared service.

Skills tagged by freehire: acceptance-criteria, agentic-ai, ai, conversational-ai, llm, nodejs, python, sales-enablement, typescript, version-control, webrtc