# ADR-007: Selection of Load Testing Tool

**Status:** Accepted

---

## Context

The Flash Sale system is designed to handle extreme "burst traffic".

We need to verify:

- Atomicity of Redis Lua scripts
- Throughput of BullMQ workers

---

## Decision

We will use **k6** as the primary tool for performance and load testing.

---

## Consequences

### ✅ Positive

#### Performance

- High load generation with low resource usage

#### Developer Experience

- JavaScript-based scripts

#### CI/CD Integration

- Native thresholds

#### Observability

- Integration with Prometheus/Grafana

---

### ⚠️ Negative

#### Setup

- Requires local installation

---

### ⚖️ Trade-offs

- Favoring **performance and simplicity**

---

### ❗ Risks & Mitigations

#### Test Drift

- Keep tests in `/load-tests` directory

---

## Alternatives Considered

### Apache JMeter

- High resource usage
- XML configs

### Locust

- Requires clustering

### Autocannon

- Limited features

---

## References

- https://k6.io/docs/
- https://grafana.com/docs/k6/latest/
- https://github.com/grafana/k6
