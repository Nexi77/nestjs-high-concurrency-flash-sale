import { EventDetails } from '@lib/common';

export const DEFAULT_EVENTS: EventDetails[] = [
  {
    id: '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
    slug: 'flash-sale-lab-warsaw',
    name: 'Flash Sale Lab',
    city: 'Warsaw',
    venue: 'Powisle Power Hall',
    startsAt: '2026-05-21T18:30:00.000Z',
    teaser:
      'A live checkout stress test disguised as a sharp one-night event experience.',
    description:
      'Flash Sale Lab is a compact event intentionally designed to showcase burst traffic handling, async persistence, and real-time order reconciliation in a public-facing checkout flow.',
    highlights: [
      'Guest checkout with one-email-one-ticket semantics',
      'Redis reservation gate with write-behind persistence',
      'Live order progress visible through SSE',
    ],
    remainingInventory: 100,
  },
  {
    id: '0f915fd7-7db8-41e8-bdc4-bc55df582d7b',
    slug: 'queue-systems-night-krakow',
    name: 'Queue Systems Night',
    city: 'Krakow',
    venue: 'Stara Zajezdnia Hall',
    startsAt: '2026-06-03T19:00:00.000Z',
    teaser:
      'A smaller drop focused on fairness, burst absorption, and operational simplicity.',
    description:
      'Queue Systems Night explores what happens after the marketing page ends: limited inventory, fast intent capture, and a transactional frontend that stays honest about eventual consistency.',
    highlights: [
      'Transactional UX without authentication overhead',
      'Backend-enforced uniqueness and inventory safety',
      'Read model composed from PostgreSQL and Redis',
    ],
    remainingInventory: 64,
  },
  {
    id: '8d3d4218-7848-4e5f-9470-7e2d4d8a1f55',
    slug: 'real-time-checkout-session-gdansk',
    name: 'Real-Time Checkout Session',
    city: 'Gdansk',
    venue: 'Shipyard Forum',
    startsAt: '2026-06-17T17:45:00.000Z',
    teaser:
      'An event detail flow built to show how live state belongs in the product, not just in backend diagrams.',
    description:
      'Real-Time Checkout Session keeps the domain narrow on purpose so the architecture can stay visible: event selection, guest reservation, and live order completion updates from the worker path.',
    highlights: [
      'Server-first Next.js route design',
      'SSE with heartbeats and reconnect-aware UX',
      'Minimal domain, strong infrastructure story',
    ],
    remainingInventory: 42,
  },
];
