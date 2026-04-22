# ADR-005: Decoupled Worker and Notification Service

**Status:** Proposed

---

## Context

To ensure system resilience and high availability, we need to separate:

- Order ingestion (API)  
- Order persistence (Worker)  
- User notification (SSE)  

Coupling these responsibilities in a single service risks resource contention (e.g., connection exhaustion) and reduces fault isolation.

---

## Decision

- Workers will connect directly to PostgreSQL to avoid API overhead  

- A separate Notification Service will handle **:contentReference[oaicite:0]{index=0} (SSE)** connections to prevent connection exhaustion on the main API  

- **:contentReference[oaicite:1]{index=1}** will be used as the communication bridge between Workers and the Notification Service  

---

## Consequences

### ✅ Positive

#### Reliability

- The system can process the queue even if the public API is down  
- Improved fault isolation between components  

#### Scalability

- Independent scaling of:
  - API (ingestion)  
  - Workers (processing)  
  - Notification Service (connections)  

---

### ⚠️ Negative

#### Complexity

- Introduction of three distinct backend services:
  - API  
  - Worker  
  - Notification Service  

- Increased operational overhead:
  - Deployment  
  - Monitoring  
  - Debugging distributed flows  

---

### ⚖️ Trade-offs

- Favoring **resilience and scalability** over system simplicity  

---

### ❗ Risks & Mitigations

#### Message Delivery

- Use retry mechanisms and acknowledgements where applicable  

#### Observability

- Centralized logging and tracing across services  
- Monitor Pub/Sub lag and delivery failures  

#### Connection Management

- Enforce limits and timeouts for SSE connections
