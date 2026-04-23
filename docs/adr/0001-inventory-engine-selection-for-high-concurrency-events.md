# ADR-001: Inventory Engine Selection for High-Concurrency Events

**Status:** Accepted

---

## Context

The system must manage a finite pool of tickets (e.g., 100 units) under extreme load (>10k RPS).

Relational databases (e.g., PostgreSQL) suffer from **lock contention** when multiple concurrent transactions attempt to update the same row. This leads to:

- Increased latency  
- Connection pool exhaustion under peak load  

---

## Decision

We will use **Redis** as the primary engine for tracking real-time inventory levels.

---

## Consequences

### ✅ Positive

#### Performance

- Sub-millisecond latency for inventory checks  

#### Scalability

- Handles tens of thousands of requests per second  

---

### ⚠️ Negative

#### Data Consistency

- Introduces **eventual consistency** between Redis (in-memory) and PostgreSQL (persistent storage)  

---

### ⚖️ Trade-offs

- Favoring **performance and scalability** over strict consistency guarantees  
