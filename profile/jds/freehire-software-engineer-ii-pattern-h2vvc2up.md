# Software Engineer II — Pattern

Posted: 2026-11-02
Location: Pune, India · Work mode: hybrid
Apply (source): https://jobs.lever.co/pattern/323c0107-c3df-465c-829d-c24c9b0c7524?utm_source=freehire.me
freehire page: https://freehire.me/jobs/software-engineer-ii-pattern-h2vvc2up

Pattern is a leading eCommerce data and growth company headquartered in the Silicon Slopes tech hub in Lehi, Utah, with global offices in Europe, China, Australia, the Middle East, and Canada. Named to the Inc. 500 list of the fastest-growing companies in the US, Pattern has made its mark in the industry. Some of the biggest consumer brands - including Skullcandy, Nestle, Clorox, Kong, Panasonic, Tumi, and PopSockets - trust Pattern with their business, and Pattern has recruited talent from Amazon, eBay, Adobe, PepsiCo, Apple, Google, and Oracle.

Pattern values data and the engineering required to take full advantage of it. As a Software Engineer II on the AI Platforms team, you will build the systems that turn Pattern's data into automated, accountable action for our brand partners.

### Essential duties and responsibilities

- **Platform services:** design, build and run the backend services that receive events, track cases, decide whether an agent should run, and resume work when a person responds.
- **Correctness:** own the platform's correctness guarantees:
  
  - idempotency;
  - deduplication of repeated signals;
  - locking against concurrent runs;
  - recovery from crashed or stuck runs;
  - a complete audit trail of what each agent did.
  - **Agents:** build and evolve agents that follow business SOPs. Decide which steps belong in deterministic code, which need the model's judgement, and which must stay with a person.
  - **Tools:** build MCP tool servers that give agents safe, well-described access to internal data and services, with clear input and output schemas.
  - **Human-in-the-loop:** integrate approval flows: request approvals, verify signed callbacks, handle partial approval, rejection and expiry, and make sure only approved work is executed.
  - **Evaluations:** write evals for agents and tools (golden datasets, regression suites, trace review) and use them as the gate for shipping prompt, model and tool changes.
  - **Observability and cost:** instrument services and agents with tracing, metrics and logs. Track model cost per case, and keep agents from running when nothing has changed.
  - **Safety:** apply guardrails, including:
    
    - treating external content as untrusted input;
    - keeping money and policy rules in code, not in prompts;
    - never automating systems Pattern policy forbids.
    - **Cross-team work:** make changes across service boundaries with the teams that own sensors, task management, approvals and the Pi web app, including in a second language (Python or Ruby on Rails) when the work requires it.
    - **Requirements:** translate business requirements (SOPs, approval rules, escalation paths) into clear designs, tickets and runnable systems.
    - **Production support:** support production, including on-call triage when an automation misbehaves.

### What we expect

### Software Engineer II (2–5 years)

- 1+ years of production experience in your primary backend language.
- Builds well-defined parts of the platform, such as tools, agents and API endpoints, with design review from senior engineers.
- Has supported a service in production or been part of an on-call rotation.
- Has made a substantial hands-on contribution to an LLM-powered feature in production.
- Leadership and mentoring are not expected.

### Required qualifications

- Bachelor's degree in Computer Science, Information Technology, a related field, or equivalent professional experience.
- 2–5 years of professional software engineering experience, mostly on backend systems.
- **Primary skill set (one of the following):**
  
  - **TypeScript and Python**, with production experience in TypeScript (1+ year) and solid working experience in Python; or
  - **TypeScript and Ruby on Rails**, with production experience in either (1+ year) and solid working experience in the other.
    
    You should be comfortable reading and making changes in the language you use less.
    
    - Experience designing APIs and webhooks, including authentication and signature verification.
    - Has made a substantial contribution to at least one LLM-powered feature in production: tool or function calling, structured outputs, and a way to measure whether it works.
    - Comfort with AWS (ECS or containers, S3, IAM at minimum) and with Docker.
    - Production support experience: monitoring, alerting, incident response and root-cause analysis.
    - Excellent engineering practice: version control, code review, automated testing, and small, reviewable changes.
    - Strong written and spoken communication, including turning ambiguous business processes into clear technical designs.

### Preferred qualifications

- Experience with PostgreSQL in production: data modelling, transactions, indexing, and concurrency control (row locking, optimistic versioning, unique constraints).
- Experience with background jobs and queues (for example BullMQ, Sidekiq, Celery, SQS or Kafka), including retries, idempotency and dead-letter handling.
- Experience building agents or agent platforms: multi-step workflows, human approval steps, memory or state across runs.
- Experience building or consuming MCP servers, or similar tool-integration layers.
- Experience with LLM evaluation and observability tools such as Opik, Langfuse, LangSmith, Braintrust or Promptfoo.
- Familiarity with agent frameworks and SDKs (for example the Vercel AI SDK, OpenAI Agents SDK or LangGraph), and with LLM gateways or routers.
- Experience with durable workflow or event-driven patterns: transactional outbox, leases, Temporal, Step Functions or event sourcing.
- Experience with OpenTelemetry tracing.
- eCommerce or marketplace domain experience (Amazon, Walmart, Shopify or similar).
- Experience working productively with AI coding agents (for example Claude Code) on a large existing codebase.

### Your first 90 days

- **Days 1-30:**
  
  - Learn the platform end to end: follow one automation from sensor detection to approved, completed work.
  - Ship small fixes in the agents platform and a tool server.
  - Be able to explain how a repeat signal is prevented from creating duplicate work.
  - **Days 31-60:**
    
    - Own a component, such as part of the case-tracking service, an approval integration or a set of MCP tools.
    - Add an evaluation suite that catches a real regression.
    - Close one reliability gap, for example concurrent events or stuck runs.
    - **Days 61-90:**
      
      - Lead the delivery of a new automation use case across sensors, agent, tools and approvals (Software Engineer II: own a major part of it).
      - Ship it with the evaluations, monitoring, shadow-mode run and rollback plan that make it safe to leave running.

## Our core values

- **Data Fanatics:** Our edge is always found in the data
- **Partner Obsessed:** We are obsessed with partner success
- **Team of Doers:** We have a bias for action
- **Game Changers:** We encourage innovation

## Why Pattern?

- The company is a rocket ship experiencing phenomenal growth
- We have tailwinds and a long runway; we're barely scratching the surface
- We have big opportunities that will get you energized and excited
- Great benefits including time off, insurance, competitive pay

Pattern provides equal employment opportunities to all employees and applicants for employment and prohibits discrimination and harassment of any type without regard to race, color, religion, age, sex, national origin, disability, genetic information, protected veteran status, sexual orientation, gender identity or expression, or any other characteristic protected by federal, state, or local laws.

Skills tagged by freehire: ai, api, authentication, automation, aws, claude-code, data-modeling, docker, ecommerce, ecs, event-driven-architecture, iam, kafka, langfuse, langgraph, langsmith, llm, mcp, observability, openai, opentelemetry, oracle, postgresql, python, rails, root-cause-analysis, ruby, s3, shopify, sqs, test-automation, typescript, vercel, version-control, webhooks