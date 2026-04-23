
# ADR-002: Atomic Concurrency Control Strategy

**Status:** Accepted

---

## Context

To prevent **overselling**, the following operations must be executed atomically:

- Check availability  
- Decrement inventory  

Splitting these operations introduces race conditions under high concurrency.

---

## Decision

We will implement inventory operations using **Redis Lua Scripts**.

---

## Consequences

### ✅ Positive

#### Atomicity

- Redis guarantees scripts execute without interruption  
- Eliminates race conditions  

#### Performance

- Multiple operations executed in a single round-trip  
- Reduced network overhead  

---

### ⚠️ Negative

#### Maintainability

- Business logic in Lua scripts is:
  - Harder to test  
  - Harder to debug  
- Compared to application-layer code (e.g., NestJS)  

---

### ⚖️ Trade-offs

- Favoring **correctness under concurrency** and **performance** over maintainability
