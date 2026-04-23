# ADR-003: Asynchronous Persistence Pattern (Write-Behind)

**Status:** Accepted

---

## Context

Directly persisting every ticket purchase to PostgreSQL at ~10k RPS would overwhelm the database.

We need to decouple:

- User-facing **booking confirmation**
- Creation of the **permanent record**

to ensure system stability under high load.

---

## Decision

We will implement a **Load Leveling** pattern using an asynchronous queue (e.g., BullMQ or Redis Streams).

Flow:

1. API acknowledges booking after:
   - Successful Redis Lua script execution  
   - Job is enqueued  
2. Background worker processes jobs asynchronously  
3. Persistence to PostgreSQL happens at a controlled, sustainable rate  

---

## Consequences

### ✅ Positive

#### Resilience

- System remains operational during database slowdowns or outages  
- User requests are not blocked by persistence layer  

#### Scalability

- Database load is smoothed over time  
- Workers can be scaled independently  

---

### ⚠️ Negative

#### Complexity

- Requires monitoring of:
  - Queue lag  
  - Worker health  

#### Eventual Consistency

- Delay between booking confirmation and persistence in PostgreSQL  

---

### ⚖️ Trade-offs

- Favoring **availability and resilience** over immediate consistency  

---

### ❗ Risks & Mitigations

#### Error Handling

- Mandatory implementation of **Dead Letter Queue (DLQ)**  
- Retries with backoff strategy  
- Idempotent worker processing to avoid duplicates
