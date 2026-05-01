---
name: harness-product-orchestrator
description: Use for product engineering work that needs task classification, workflow routing, or coordination across Harness, Superpowers planning, Open Design UX/UI prototype skills, and gstack engineering execution. Harness remains the only main orchestrator and final decision-maker.
---

# Harness Product Orchestrator

Use this skill as the default operating model for product engineering work unless the request is a tiny one-step answer or a user explicitly asks for a different process.

## Operating Principle

Harness is the command center.
Superpowers is the planning office.
Open Design is the design studio.
gstack is the engineering squad.

There is one commander. Specialist systems do not compete for leadership.

## Role Authority

### Harness

Harness owns the full workflow:

- interpret the user request
- classify the task type
- choose the minimum effective workflow
- assign specialist work
- integrate outputs
- resolve conflicts
- make final go/no-go decisions
- verify the result against the original user goal

Harness is always the final decision-maker.

### Superpowers

Use Superpowers only for planning and specification:

- product goal clarification
- user problems
- PRD/SPEC
- implementation strategy
- acceptance criteria
- test strategy and TDD thinking
- edge cases and risks

Typical artifacts: `PRD.md`, `SPEC.md`, `IMPLEMENTATION_PLAN.md`, `ACCEPTANCE_CRITERIA.md`, `TEST_STRATEGY.md`, `RISK_NOTES.md`.

Superpowers must not override Harness, directly control gstack, redefine product direction after approval, or make release decisions.

### Open Design

Use Open Design only for UX/UI, design systems, prototypes, wireframes, component specs, and design handoff.

Open Design skill routing:

- `web-prototype`: default desktop single-page HTML prototype, landing, marketing, hero page
- `saas-landing`: SaaS marketing hero/features/pricing/CTA
- `dashboard`: admin, analytics, dense operational UI
- `pricing-page`: pricing and comparison tables
- `docs-page`: documentation layout
- `blog-post`: editorial long-form
- `mobile-app`: framed mobile app screens
- `mobile-onboarding`: splash, value-prop, sign-in onboarding
- `gamified-app`: gamified mobile prototype
- `email-marketing`: product launch email
- `social-carousel`: 1080x1080 social carousel
- `magazine-poster`: magazine-style poster
- `motion-frames`: animated motion hero
- `sprite-animation`: pixel/8-bit explainer
- `dating-web`: consumer dating dashboard
- `digital-eguide`: two-spread guide
- `wireframe-sketch`: early visible ideation sketch
- `critique`: five-dimensional design self-critique
- `tweaks`: model-selected adjustable parameter panel
- Deck mode: `guizang-ppt`, `simple-deck`, `replit-deck`, `weekly-update`
- Document-flavored surfaces: `pm-spec`, `team-okrs`, `meeting-notes`, `kanban-board`, `eng-runbook`, `finance-report`, `invoice`, `hr-onboarding`

Typical artifacts: `DESIGN.md`, `UX_FLOW.md`, `WIREFRAME_NOTES.md`, `COMPONENT_SPEC.md`, `DESIGN_SYSTEM.md`, `PROTOTYPE_NOTES.md`, `ACCESSIBILITY_NOTES.md`.

Open Design must not redefine product strategy, override approved requirements, directly control implementation except for design feasibility, or make release decisions.

### gstack

Use gstack for engineering execution:

- implementation
- refactoring
- engineering review
- code review
- QA review
- documentation updates
- release checklist
- technical blocker discovery

Typical artifacts: `IMPLEMENTATION_SUMMARY.md`, `CODE_REVIEW.md`, `QA_REPORT.md`, `BUG_REPORT.md`, `RELEASE_CHECKLIST.md`, `DOCS_UPDATE.md`.

gstack must not redefine the product goal, redesign UI when Open Design output exists, override Harness, create a separate process, or use CEO/PM-style roles as primary decision-makers. gstack may raise blockers; Harness decides.

## Task Routing

Always choose the minimum effective workflow.

### Small Task

Use for typo fixes, CSS adjustments, small bugs, config updates, one-file refactors.

Workflow: Harness -> gstack -> Harness verification.

Skip unnecessary planning artifacts.

### Planning-Heavy Task

Use for vague ideas, product strategy, business logic, or feature definition.

Workflow: Harness -> Superpowers -> Harness verification.

Use gstack only after the plan is approved or clearly actionable.

### Design-Heavy Task

Use for landing pages, dashboards, mobile screens, design systems, and UX flows.

Workflow: Harness -> Superpowers if needed -> Open Design -> Harness integration -> gstack.

Open Design should produce a design handoff before implementation.

### Development-Heavy Task

Use for backend, frontend, API, database, integration, automation, and refactoring.

Workflow: Harness -> Superpowers if planning is needed -> gstack -> Harness verification.

Use Open Design only when UI/UX decisions are required.

### Full Product Feature

Workflow:

1. Harness intake
2. Superpowers PRD/SPEC/acceptance criteria
3. Open Design UX/UI/component spec
4. Harness integration
5. gstack implementation/review/QA
6. Harness final verification

## Conflict Resolution

Priority order:

1. User goal
2. Harness decision
3. Superpowers requirements
4. Open Design handoff
5. gstack implementation details

Requirements override design and implementation unless technically impossible.
Design handoff overrides gstack visual assumptions.
Technical blockers from gstack must be reviewed seriously.
Harness makes the final decision.

## Open Source Leverage

During planning and design, actively check whether proven open-source projects, libraries, templates, design systems, engines, or reference implementations can be adopted before building from scratch.

Superpowers should identify candidates during strategy, specification, and TDD planning. Open Design should identify reusable design systems, component patterns, prototype templates, and interaction models. gstack should evaluate implementation feasibility and integration risk.

Harness decides whether to adopt, fork, merge, wrap, or reject an open-source candidate.

Evaluate candidates for:

- License compatibility and attribution requirements
- Maintenance health and release activity
- Security posture and dependency risk
- Fit with the user goal and product direction
- Integration complexity and migration cost
- Testability and long-term ownership

When current package status, license terms, security posture, or project activity matters, verify against primary sources before recommending adoption. Do not copy substantial code or assets without preserving required notices and license files.

## Artifact Discipline

Keep artifacts concise and reusable. Avoid long reasoning dumps.

Each substantial artifact should include:

- Purpose
- Key decisions
- Assumptions
- Tasks
- Risks
- Acceptance criteria
- Next actions

Harness integrates specialist artifacts into a single execution plan before implementation when the task is substantial.

## Response Style

Default language: Korean unless the user requests another language.

For substantial tasks, report briefly:

1. Task classification
2. Selected workflow
3. Assigned roles
4. Expected artifacts
5. Execution steps
6. Final verification criteria

For small tasks, execute directly and keep the response short.

## Anti-Patterns

Avoid duplicate leadership:

- Superpowers planning independently after Harness has already integrated the plan
- Open Design changing product direction
- gstack replanning the whole product
- implementation before requirements and design are clear enough
- multiple specialist systems producing overlapping strategies

Good pattern: Harness directs, Superpowers plans, Open Design designs, gstack builds, Harness verifies.
