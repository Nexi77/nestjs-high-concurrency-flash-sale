# ADR-008: Guest Checkout Identity via Email

**Status:** Accepted

---

## Context

The current flash-sale flow identifies a buyer with a generic `userId` string.

For the next project step we want to build a Next.js frontend that supports guest checkout without implementing a full authentication flow yet.

We still need:

- A stable idempotency key for "one reservation per customer per event"
- A contact channel for notifications and future order lookup
- A contract that can later evolve into authenticated checkout without rewriting the whole purchase flow

---

## Decision

We will replace `userId` in the purchase flow with `customerEmail`.

The email becomes the temporary business identity for guest checkout:

- request validation at the API boundary,
- idempotency key in Redis for the reservation phase,
- uniqueness key in PostgreSQL together with `ticketId`,
- recipient identifier in the notification flow.

---

## Consequences

### Positive

- The checkout contract becomes realistic for a public frontend
- We avoid building auth before it creates product value
- The frontend can expose a simple, credible reservation form
- The model leaves room for a future `customerId` without changing the reservation semantics

### Negative

- Email is personally identifiable information and requires more care than a synthetic identifier
- The current implementation supports one reservation per email per event, which may be too restrictive for future business cases

### Trade-offs

- We favor delivery speed and a realistic guest flow over a fully separated identity model

---

## Risks & Mitigations

### Duplicate identities caused by casing or whitespace

- Normalize email input to `trim().toLowerCase()` at the API boundary

### Concurrent duplicates during async persistence

- Enforce uniqueness on (`ticketId`, `customerEmail`) in the order entity

### Future migration to authenticated users

- Treat `customerEmail` as a guest-checkout identity, not as a permanent domain user model

---

## Alternatives Considered

### Keep a random `userId`

- Easy technically, but unrealistic for a public guest checkout flow
- Pushes unnecessary identity generation into the frontend

### Implement full authentication now

- Stronger long-term identity model
- Too expensive for the current PoC goal and distracts from concurrency and React/Next.js concerns

### Use phone number instead of email

- Possible notification channel
- Worse developer ergonomics for this PoC and weaker fit for web checkout
