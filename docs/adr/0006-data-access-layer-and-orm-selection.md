# ADR-006: Data Access Layer and ORM Selection

**Status:** Proposed

---

## Context

The "Flash Sale" worker requires high-performance batch insertion to handle thousands of orders efficiently.

We compared:

- Prisma  
- TypeORM  

While Prisma offers strong Developer Experience (DX) and type safety, it introduces additional overhead in massive batch operations.

---

## Decision

We will use **TypeORM** as our ORM / Data Mapper.

---

## Consequences

### ✅ Positive

#### Performance

- Access to optimized batch inserts:
  - `INSERT INTO ... VALUES (...)`  
- Lower overhead in write-heavy workloads  

#### Integration

- Strong integration with NestJS:
  - `@nestjs/typeorm`  

---

### ⚠️ Negative

#### Developer Experience

- More verbose entity definitions  
- Less ergonomic API compared to Prisma  

#### Migrations

- Manual migration management  

---

### ⚖️ Trade-offs

- Favoring **performance and control** over developer ergonomics  

---

### ❗ Risks & Mitigations

#### Incorrect Usage

- Risk of inefficient patterns (e.g., `.save()` in loops)  

#### Mitigation

- Enforce QueryBuilder for batch operations  
- Code reviews and guidelines
