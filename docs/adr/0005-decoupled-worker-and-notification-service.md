# ADR-005: Decoupled Worker and Notification Service

**Status:** Accepted

---

## Context

To ensure system resilience and high availability, we need to separate:

- Order ingestion (API)
- Order persistence (Worker)
- User notification (SSE)

Coupling these responsibilities in a single service risks resource contention and reduces fault isolation.

---

## Decision

- Workers will connect directly to PostgreSQL to avoid API overhead

- A separate Notification Service will handle **Server-Sent Events (SSE)** connections

- **Redis Pub/Sub** will be used as the communication bridge between Workers and the Notification Service

---

## Consequences

### ✅ Positive

#### Reliability

- The system can process the queue even if the public API is down
- Improved fault isolation

#### Scalability

- Independent scaling of services

---

### ⚠️ Negative

#### Complexity

- Three backend services:
  - API
  - Worker
  - Notification Service

---

### ⚖️ Trade-offs

- Favoring **resilience and scalability** over simplicity

---

### ❗ Risks & Mitigations

#### Message Delivery

- Retry mechanisms and acknowledgements

#### Observability

- Centralized logging and tracing

---

## References

- https://redis.io/docs/interact/pubsub/
- https://microservices.io/patterns/data/pub-sub.html
