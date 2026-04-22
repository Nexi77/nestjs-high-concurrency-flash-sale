# ADR-004: Frontend Synchronization via SSE and Hybrid Reads

**Status:** Proposed

---

## Context

Due to the asynchronous nature of the persistence layer (Write-Behind), there is a delay between ticket reservation and its availability in the main database.

This creates a gap where:

- The user has a confirmed booking  
- The record is not yet available in PostgreSQL  

---

## Decision

We will use **:contentReference[oaicite:0]{index=0} (SSE)** to push real-time updates to the frontend.

Additionally, the **Order Status** endpoint will implement a **Fallback Read Strategy**:

- First check PostgreSQL  
- If not found, check Redis (e.g., "Processing" set)  

---

## Consequences

### ✅ Positive

#### User Experience

- Improved UX with real-time feedback  
- Users receive immediate updates about order status  

#### Performance

- Lower server overhead compared to **:contentReference[oaicite:1]{index=1}**  
- Efficient one-way communication from server to client  

---

### ⚠️ Negative

#### Complexity

- Increased backend complexity:
  - Tracking in-flight orders in Redis  
  - Maintaining consistency between Redis and PostgreSQL  

#### Consistency Model

- Requires handling of temporary "missing" state in PostgreSQL  

---

### ⚖️ Trade-offs

- Favoring **real-time UX** and **system efficiency** over architectural simplicity  

---

### ❗ Risks & Mitigations

#### State Tracking

- Use dedicated Redis structures (e.g., sets or hashes) for in-flight orders  

#### Synchronization Issues

- Ensure cleanup of Redis state after successful persistence  
- Implement timeouts/TTL for stuck processing states
