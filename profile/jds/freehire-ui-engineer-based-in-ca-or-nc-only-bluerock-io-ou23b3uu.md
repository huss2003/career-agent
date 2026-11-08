# UI Engineer (Based in CA or NC only) — BlueRock.io

Posted: 2026-11-07
Location: AUS · Work mode: remote
Apply (source): https://builtin.com/job/ui-engineer-based-ca-or-nc-only/12120330?utm_source=freehire.me
freehire page: https://freehire.me/jobs/ui-engineer-based-in-ca-or-nc-only-bluerock-io-ou23b3uu

**Mission:** Live at the intersection of app runtime & security. Protect applications in a fundamental way so that developers can build great application services and not be constantly looking over their shoulder. BlueRock is changing the landscape of App runtime security.

**The role**

**Location: Must be based in CA (preferably San Francisco Bay Area) or North Carolina**

You will work alongside BlueRock's product designers and the control plane development team on our operator consoles. These are the React front ends that engineers and security teams use to manage large fleets of protected nodes, see what AI agents are actually doing across those fleets, and author the policy that constrains them.

The domain is AI and agentic systems, seen from the operations and security side. When an agent calls an MCP server, spawns a subagent, runs a shell command in a sandbox, or burns $40 of tokens in an afternoon, our UI is where a person sees it, understands it, and decides what to allow. So the interesting problems are visibility problems (how do you show a thousand agent sessions so someone can find the one that matters?) and control problems (how do you author an enforcement policy without a mistake taking production down?).

This is a mid-level role. We expect about 3–5 years of professional front-end experience, or equivalent work that clearly shows the same judgment. The ideal candidate is passionate about user experience, design, and AI-assisted software development, with a demonstrated grounding in engineering best practices. The title says UI, but the work doesn’t stop there: you’ll work closely with our backend services, and a feature is finished when it’s proven working live, not when the screen looks right.

**Working with design delivered as code**

At BlueRock, product designers design and collaborate in code. Instead of handing off static mockups, they build working UI with AI coding tools, against real data, and open merge requests. Iteration happens so quickly that it has outpaced our capacity for robust engineering collaboration and review.

This role closes that gap. You will collaborate directly with product designers and backend developers to keep UI development fast, by bridging the gap between vibe code and high-quality, sustainable, well-tested code. Some days that means reviewing and hardening a designer's branch so it can merge. Other days it means building the shared components, tests and guardrails that make the next branch need less hardening.

Beyond reviewing and hardening code, you'll help shape how it gets made. Working with designers and the AI tools they use, you'll turn what each review teaches us into shared components, conventions, tests and agent instructions. Over time the whole practice becomes more predictable, and each new branch arrives closer to production-ready.

**Roles and collaboration**

Software development roles are blurring more than ever. This role reports to product design, with API and data-layer guidance from our control plane engineering lead. You must be attuned to the perspectives of both UX/Design and Engineering, acting as a bridge between the goals and priorities of both sides, while ultimately deferring to UX/design partners on matters of style, copy, and information architecture.

In practice: when a designer's branch makes a choice about layout, copy or flow, you protect the intent and fix the implementation. When the implementation can't support the intent, because of performance, data shape or maintainability, you say so early and bring options rather than quietly changing the design.

**What you'll do**

- Review designer-authored merge requests and bring them to production quality: structure, types, tests, accessibility, performance, and both light and dark themes.
- Turn one-off UI from fast iteration into shared, documented components in our design system and Storybook, and migrate the apps onto them.
- Make data-dense views hold up at real scale. Dashboards, tables, charts, and time-range and filter controls that work on a demo tenant also have to work on one with billions of events.
- Wire UI to the API layer (GraphQL), and work with backend developers when a view needs a new query, field or endpoint.
- Own UI test coverage: Vitest for units and Playwright for end-to-end flows, kept green in CI.
- Test UI end to end in live, secured environments, with full authentication and authorization, real data and realistic load, before calling it done.
- Keep UI work moving across release lines: shipping behind feature flags, and carrying fixes between branches when a release is frozen.
- Fix UI bugs across the consoles and the Windows, Mac and Linux clients: layout and overflow, tooltips and popovers, empty and zero states, things that are technically correct and still confusing.
- When needed, design new interfaces within the existing design system, and bring them to design for review.
- Help set the guardrails that make AI-assisted UI development safe: lint rules, conventions, review checklists, and the instructions our AI coding tools follow.

**How we expect you to work**

These are the habits of a careful engineer. They matter more here, not less, because so much of the code you touch was drafted quickly by someone else or by an AI tool.

1. **Diagnose before you change.** Find the actual cause, which is usually a layer away from the symptom, and be able to explain why your fix addresses it. A change that makes the symptom disappear is not the same as a fix.
2. **Small, deliberate diffs.** Solve the problem in front of you. Don't refactor adjacent code on the way past, and don't build the abstraction you may need later.
3. **Fix it in one place.** When the same bug shows up in three panels, the fix belongs in the shared component, not copied three times. Knowing where a change belongs is most of the skill.
4. **Verify, then claim.** Run it, look at it, check both themes and a narrow viewport, get types and lint clean, and write the test where a test is what proves it. Then say plainly what you checked and what you did not. This applies double to AI-assisted work: you own the diff, whoever drafted it.
5. **Say when you're unsure.** A requirement with two readings is a question, not a guess. Surfacing a problem early is always cheaper than discovering it in review.

**Our UI stack and design system**

Our front ends are several React and TypeScript apps that share one codebase: our enterprise operator consoles and our cloud product for builders.

All of them are built on our own design system. It is a shared React component library on top of Ant Design, with design tokens for color, type and spacing, light and dark themes, and a shared app shell for navigation, page layout and headers. Every component is documented in Storybook, published from CI, which serves as the reference for designers, engineers and AI coding tools alike. The library also carries written instructions for AI coding assistants, so generated code reaches for the system's components and tokens instead of inventing its own.

A large part of this role is the design system itself. That means promoting patterns out of individual apps into shared components, writing their stories, keeping tokens and themes consistent so the apps don't drift, and making the system the easiest path for anyone, or any agent, building UI.

- **Front end:** React, TypeScript, Vite
- **Design system:** our component library built on Ant Design, including design tokens and light and dark themes
- **Documentation:** Storybook, published to GitLab Pages
- **Data and charts:** GraphQL; ECharts for the data-dense views
- **Testing:** Vitest, Playwright, and contract and smoke suites in CI
- **Delivery:** GitLab merge requests and pipelines, release branches, feature flags
- **Further back:** TypeScript and Rust services over graph and columnar stores, built on OpenTelemetry, plus desktop apps and services across Mac, Windows and Linux

You don't need experience with all of it. You do need to be strong in TypeScript and React, and willing to read code before changing it.

**What you bring**

- About 3–5 years building production front ends in TypeScript and modern React: hooks, composition, state that lives at the right level, and an understanding of why a re-render happens.
- An end-to-end view of the systems behind the UI. Designing in code gets a feature most of the way to working, and you close the rest of the gap. For you, “done” doesn’t stop at the UI working. It means the UI is integrated and shown to work live, in a secured environment with full authentication and authorization, under realistic load.
- Integration testing against complex backends. Tests that only run against mock data in a standalone dev stack aren’t enough here. You can create, integrate and run tests in live environments to check data validity, load, security and scale, and you keep unit, integration and end-to-end suites green in CI.
- Performance instincts for data-heavy UI: pagination, virtualization, server-side filtering, and knowing when a slow page is a query problem rather than a rendering problem.
- A track record of reviewing other people’s code and improving it without rewriting it.
- Git in complex repositories with several active release branches, where a single fix may need to be cherry-picked, ported or graft-merged onto more than one of them. Readable commits, and responding to review without taking it personally.
- Hands-on use of AI coding tools in real work, with clear habits for checking what they produce.
- CSS that holds up: flexbox and grid, overflow and scroll containers, responsive behaviour, and why a tooltip or popover ends up clipped.
- Experience building or contributing to a component library or design system, ideally with Storybook and design tokens.
- Careful attention to visual detail and real interest in UX. Much of this work is noticing that something is two pixels wrong, or that a label is technically correct and still confusing.
- Genuine interest in the AI and agentic space, and in the operational and security questions it creates.

**Nice to have:** Ant Design; GraphQL; ECharts or other charting libraries; design training or a portfolio; experience on a team where designers commit code; writing conventions or instructions for AI coding tools; desktop UI across Mac, Windows and Linux; dense operational tooling such as observability, security or infrastructure products.

**Not required:** a computer science degree, if your work shows the same rigor. Deep backend, security or infrastructure expertise, or any knowledge of our domain (fleet management, telemetry, agent observability, policy enforcement). We will teach that.

**Your first 90 days**

1. **First month: land changes safely.** Ship scoped fixes in the consoles. Learn the component library, theme tokens and API layer. Start reviewing designer merge requests alongside an engineer.
2. **Second month: own review on a surface.** Become the primary reviewer for designer-authored UI on one product area, and extract at least one repeated pattern into a shared component.
3. **Third month: make the next branch easier.** Get the flows you own covered by tests in CI, and write down the conventions and guardrails that make designer branches need less hardening.

**About BlueRock:**

BlueRock is a well-funded, early stage cybersecurity company founded by experienced security minded entrepreneurs. Our mission is to change the game in cybersecurity. Attackers are exploiting in hours. The dependency tree is exploding. Developers are drowning in vulnerability debt. BlueRock changes the game, enabling organizations to shift from chasing CVEs and exploits to proactively protecting the foundations of applications and computing, so that developers can build great applications without looking over their shoulders.

Skills tagged by freehire: accessibility, agentic-ai, ai, api, authentication, bash, cloud, css, cybersecurity, git, gitlab, graphql, information-architecture, integration-testing, linux, mcp, observability, opentelemetry, playwright, react, rust, storybook, typescript, virtualization, vite, vitest