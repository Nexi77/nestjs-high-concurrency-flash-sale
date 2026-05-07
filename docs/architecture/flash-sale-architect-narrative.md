# Flash Sale Architect Narrative

## Short Version

This project is a focused flash-sale system built to handle high contention around limited inventory.

I intentionally kept the product scope narrow so the architectural decisions stay visible. Instead of building a wide e-commerce platform, I focused on one hard problem: how to accept ticket purchase intent safely under burst traffic, persist it asynchronously, and still give the user a credible real-time frontend experience.

The core design is:

- Redis is the hot-path reservation gate
- BullMQ decouples request acceptance from persistence
- PostgreSQL is the durable store for completed orders and event metadata
- Next.js renders a server-first frontend that upgrades into SSE for live order completion

That shape let me demonstrate concurrency control, eventual consistency, idempotent behavior, and frontend/backend contract design in one coherent flow.

---

## 3-5 Minute Interview Narrative

If I were presenting this project in an interview, I would frame it like this:

### 1. Problem framing

I wanted to model a flash-sale scenario where a lot of users compete for a small inventory pool. In that kind of system, the main risk is not CRUD complexity, but overselling, duplicate reservations, and poor UX while the backend is still processing the order.

So I optimized the project around one question:

How do I keep the purchase path safe under high concurrency while still giving the frontend a fast and understandable experience?

### 2. Main architectural decision

I separated the system into a fast acceptance path and a slower persistence path.

- The API Gateway accepts the request.
- Redis handles the atomic reservation check using Lua, which prevents overselling and duplicate reservations for the same email.
- If the reservation succeeds, I enqueue the order into BullMQ and return immediately with `pending` plus `orderId`.
- A worker persists the final order into PostgreSQL asynchronously.

That means I deliberately chose eventual consistency over synchronous simplicity, because in a flash-sale system the hot path should stay short and predictable.

### 3. Identity and idempotency

I intentionally used `customerEmail` as the guest-checkout identity instead of building a full auth system.

That gave me:

- a realistic frontend contract,
- a business key for one reservation per event,
- and a way to talk about idempotency without over-engineering authentication.

The protection works in layers:

- Redis blocks duplicate reservation attempts in the hot path,
- PostgreSQL enforces uniqueness on `(ticketId, customerEmail)`,
- and the worker handles duplicate writes safely if jobs race.

So the design is not relying on any single safety mechanism.

### 4. Frontend architecture

On the frontend I did not want a generic SPA with API calls spread across components.

I used Next.js App Router in a server-first way:

- landing and event pages are rendered as server pages,
- checkout is a server page with a client-side form island,
- order status is a server page with a client-side SSE island.

That let me keep the routing and initial reads on the server, and push browser-only logic into the smallest possible client boundaries.

### 5. Real-time order feedback

The interesting frontend problem was how to show order progress after the API returns `pending`.

I solved it with a hybrid model:

- the page first reads status through a normal endpoint,
- then subscribes to SSE for the terminal update,
- and if the stream fails, it reconciles by reading the status endpoint again.

Internally, workers publish status changes through Redis Pub/Sub, API Gateway fans them out over SSE, and the browser listens only for its own order.

That gave me live UX without making SSE the only source of truth.

### 6. Why the scope is intentionally narrow

I deliberately did not add full auth, payments, carts, dashboards, or a huge event-management domain.

That was a conscious trade-off.

The goal of this project was to make concurrency control, async persistence, and consistency boundaries highly visible. A wider product scope would have hidden the system design signal.

### 7. Where I would extend it in production

If I were pushing this toward production, the next steps would be:

- stronger observability and alerting around stuck pending orders,
- more explicit operational metrics,
- possibly a formal `Idempotency-Key` layer for broader API use cases,
- and re-evaluating Redis Pub/Sub if the SSE fan-out requirements became much larger.

So the current version is intentionally optimized for architectural clarity and realistic PoC scale, not for every production concern at once.

---

## Strong Points To Emphasize

- The project is centered on a real high-contention problem, not generic CRUD.
- The write path is short, atomic, and optimized for acceptance under load.
- Persistence is asynchronous, but UX remains understandable through `pending` and SSE.
- The system uses layered protection: Redis, queueing, DB constraints, and worker-side recovery.
- The frontend respects the backend consistency model instead of pretending everything is synchronous.
- ADRs document the key trade-offs explicitly.

---

## Questions You Should Be Ready For

### Why Redis for the reservation gate?

Because flash-sale inventory is a hot-path contention problem. Redis gives very fast in-memory operations, and Lua lets me enforce the duplicate-check plus stock decrement atomically.

### Why not write directly to PostgreSQL in the request path?

Because I wanted the acceptance path to stay short and predictable under burst traffic. PostgreSQL remains the durable system of record, but the request path should not wait for the full persistence workflow if I can safely defer it.

### Why use eventual consistency here?

Because the business action is naturally split into two phases:

- reserve inventory now,
- persist the order shortly after.

That lets the system absorb bursts better while still keeping the frontend informed.

### Why SSE instead of WebSockets?

Because I only need one-way updates from server to client. SSE is simpler, cheaper to reason about, and a better fit for order status progression than a bi-directional channel.

### Why no debounce on the buy button?

Because debounce is more appropriate for noisy user input like search. For a buy action I would rather disable repeat submits immediately in the UI and rely on backend correctness for true safety.

### Do you already have production-grade idempotency?

I have strong domain-level idempotent behavior through Redis checks, database uniqueness, and worker-side duplicate handling. I do not yet have a full generic `Idempotency-Key` layer, and I would only add that if the API surface and retry model required it.

### What are the known limitations?

- Redis Pub/Sub is not a durable event log.
- The SSE layer is designed for realistic PoC scale, not extreme fan-out.
- The event catalog is intentionally small and bootstrapped for demo purposes.
- I prioritized clarity of the flash-sale problem over broader product scope.

---

## 30-Second Summary

This is a flash-sale architecture built around one hard problem: accepting ticket demand safely under burst traffic.

I used Redis as the atomic reservation gate, BullMQ for asynchronous persistence, PostgreSQL for durable state, and Next.js plus SSE for a frontend that stays honest about eventual consistency.

The project is intentionally narrow, but it shows strong system design fundamentals: concurrency control, layered safety, real-time UX, and documented architectural trade-offs.
