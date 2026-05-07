# ADR-011: Event Catalog Read Model for Frontend Selection

**Status:** Accepted

---

## Context

The current checkout flow requires the frontend to know a raw `ticketId` and send it directly in the purchase request.

This was acceptable while validating the high-concurrency reservation path, but it is not a credible product experience for a public frontend.

We now want the frontend to:

- display available events fetched from the backend,
- let the user choose an event before entering checkout,
- present event details without exposing infrastructure-shaped identifiers in the main user flow.

At the same time, we do not want to weaken the existing concurrency architecture:

- Redis remains the inventory gate for reservations,
- PostgreSQL remains the durable store for metadata and completed orders,
- the purchase path must stay safe under heavy contention.

---

## Decision

We will introduce a dedicated **event catalog read model**.

The model is split by responsibility:

- **PostgreSQL** stores event metadata such as name, location, schedule, and initial inventory
- **Redis** remains the source for live remaining stock during active sales
- **API Gateway** exposes `GET /events` and `GET /events/:eventId` for frontend consumption

The checkout flow will change from:

- user manually enters `ticketId`

to:

- user selects an event from the catalog,
- frontend renders event details,
- checkout form submits the event identifier implicitly.

For the current project scope, demo events are bootstrapped automatically if the catalog is empty.

---

## Consequences

### Positive

- The frontend becomes product-shaped instead of infrastructure-shaped
- Event selection can happen through normal navigation and server-rendered data fetching
- Inventory-sensitive purchase logic stays unchanged and isolated behind the existing reservation gate
- The project demonstrates a healthier separation between metadata reads and transactional writes

### Negative

- We now maintain an additional entity and read API for event metadata
- Demo bootstrap logic adds some development-oriented behavior to the backend

### Trade-offs

- We favor a realistic frontend contract and clearer domain modeling over keeping the PoC limited to a raw `ticketId` form

---

## Risks & Mitigations

### Drift between event metadata and live stock

- Treat PostgreSQL metadata as descriptive and Redis stock as operational
- Compose both into one API read model in the gateway

### Reinitializing inventory accidentally

- Only seed Redis stock when it is missing, never overwrite an existing stock key during catalog bootstrap

### Over-engineering the buy action with client-side debounce

- Do not debounce purchase submission
- Use immediate submit locking in the UI and rely on backend idempotency and uniqueness controls for correctness

---

## Alternatives Considered

### Keep manual `ticketId` entry

- Lowest implementation cost
- Poor product experience and weak frontend story

### Store both metadata and inventory only in PostgreSQL

- Simpler read model
- Weakens the existing concurrency strategy that intentionally relies on Redis for hot inventory control

### Build a separate event service or repository

- Stronger bounded context separation
- Too much ceremony for the current monorepo scope and project size
