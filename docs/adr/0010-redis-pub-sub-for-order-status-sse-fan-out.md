# ADR-010: Redis Pub/Sub for Order Status SSE Fan-Out

**Status:** Accepted

---

## Context

The frontend now has a stable `GET /orders/:orderId/status` read model backed by:

- PostgreSQL for persisted orders,
- Redis for temporary `pending` state.

We also want to provide real-time feedback on the `/order/[orderId]` page with Server-Sent Events (SSE).

At this point we need to choose how status changes will flow through the backend:

- the worker is the place where asynchronous completion becomes known,
- the API Gateway is the boundary that serves browser clients,
- the frontend should not connect directly to internal workers or infrastructure.

We therefore need an internal event propagation mechanism that:

- works across processes,
- keeps SSE termination in the API Gateway,
- does not introduce heavier infrastructure than the current project justifies.

---

## Decision

We will use **Redis Pub/Sub as the internal transport for order status updates**, and **API Gateway will expose SSE to the browser**.

The flow is:

1. API Gateway returns `pending` together with `orderId`
2. The order worker persists the order and publishes an `OrderStatusUpdatedEvent`
3. API Gateway subscribes to the Redis channel and fans the event out to connected SSE clients
4. Frontend listens to `/orders/:orderId/events` and reconciles against the existing status read model

We keep the existing hybrid read strategy:

- `GET /orders/:orderId/status` remains the source of truth for initial state,
- SSE is used to push transitions, not replace the read model.

---

## Consequences

### Positive

- SSE stays at the system edge, which keeps browser concerns inside API Gateway
- Worker and API Gateway remain decoupled at the process level
- Redis is reused as existing infrastructure instead of adding a new broker
- The frontend can recover from missed events by falling back to the status endpoint

### Negative

- We now maintain two Redis-based concerns: temporary order status state and event fan-out
- Pub/Sub messages are transient and not durable
- API Gateway needs in-memory subscriber tracking for active SSE streams

### Trade-offs

- We favor implementation simplicity and architectural clarity over guaranteed event durability

---

## Risks & Mitigations

### Missed SSE event between initial page render and stream subscription

- Keep `GET /orders/:orderId/status` as a first-class read path
- On SSE connection, re-check current status before attaching the live stream

### Stuck or orphaned pending state

- Keep TTL on pending Redis entries
- Let PostgreSQL remain the source of truth for `completed`

### Need for stronger event guarantees in the future

- Reassess Redis Streams or a dedicated broker only if the system evolves beyond PoC-scale fan-out requirements

---

## Alternatives Considered

### Polling only from the frontend

- Simpler implementation
- Worse UX and less interesting architecture for this project

### Direct API Gateway polling of PostgreSQL without internal events

- Fewer moving parts
- Loses the real-time push model we explicitly want to demonstrate

### WebSockets instead of SSE

- More flexible bi-directional channel
- More complexity than needed for one-way status updates

### Dedicated broker such as Kafka or NATS

- Stronger messaging model
- Far too heavy for the scale and purpose of this project
