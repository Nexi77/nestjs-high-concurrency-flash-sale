# ADR-009: Adopt Turborepo for Full-Stack Monorepo Orchestration

**Status:** Accepted

---

## Context

The current repository is organized as a NestJS monorepo with multiple backend applications and shared libraries.

This works well for the backend-only stage, but the next step is to add a Next.js frontend to the same repository so we can demonstrate:

- shared frontend and backend contracts,
- end-to-end local development,
- a realistic SSE-based checkout flow,
- architectural discipline across the whole product slice.

Nest workspaces are useful for backend project generation and compilation, but they are not a strong orchestration layer for a mixed-stack monorepo.

We need a lightweight monorepo tool that:

- keeps the current Nest project structure intact,
- supports adding `apps/web` without a second repository,
- gives us task orchestration across apps and libs,
- scales into future frontend and backend growth.

---

## Decision

We will keep the existing repository as the single source of truth and adopt **Turborepo** as the orchestration layer on top of the current NestJS workspace structure.

This means:

- the repo remains one monorepo,
- Nest CLI still owns backend project structure and compilation,
- Turbo owns cross-workspace task execution such as `build`, `dev`, `lint`, and `test`,
- new applications such as `apps/web` will be added as first-class workspaces.

---

## Consequences

### Positive

- Frontend and backend stay in one repository with shared context and ADR history
- Shared contracts become easier to evolve safely
- Local end-to-end development becomes simpler
- The repo gets a credible path from backend PoC to full-stack platform monorepo
- We introduce monorepo discipline without paying the migration cost of Nx or a repo split

### Negative

- The repository now has two coordination layers: Nest CLI and Turbo
- Some scripts must be expressed per workspace to let Turbo orchestrate them
- Build caching benefits will be limited until more packages expose package-level tasks and outputs

### Trade-offs

- We favor incremental evolution and low migration risk over a more opinionated monorepo platform

---

## Risks & Mitigations

### Tooling overlap between Nest and Turbo

- Keep responsibilities explicit: Nest for project compilation, Turbo for orchestration

### Monorepo complexity before the frontend is large

- Use a minimal Turbo setup now and expand only when `apps/web` and more shared packages justify it

### Future need for stronger package graph enforcement

- Reassess Nx only if the workspace grows significantly in team size, package count, or generator needs

---

## Alternatives Considered

### Keep only Nest workspaces

- Lowest change cost
- Weak support for mixed backend and Next.js orchestration

### Create a separate frontend repository

- Strong isolation
- Worse contract sharing, more duplicated setup, and weaker end-to-end developer experience

### Migrate directly to Nx

- Richer monorepo capabilities
- Higher migration and cognitive cost than needed for the current project scope
