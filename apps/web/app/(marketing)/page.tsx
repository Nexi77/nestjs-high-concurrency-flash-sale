import Link from 'next/link';
import { listEvents } from '@/lib/api/events';
import { formatEventDate } from '@/lib/utils/format';

const architectureSignals = [
  {
    title: 'Atomic reservation gate',
    description:
      'Redis Lua protects inventory under burst traffic before persistence begins.',
  },
  {
    title: 'Asynchronous persistence',
    description:
      'Orders are accepted optimistically, written by workers, and surfaced to users without blocking checkout.',
  },
  {
    title: 'Live status feedback',
    description:
      'The order view reconciles a server read model with SSE, heartbeats, and reconnect logic.',
  },
];

const principles = [
  'One email reserves one ticket, which keeps the domain tight and the concurrency story sharp.',
  'Guest checkout keeps the UX credible without dragging the project into full authentication.',
  'The frontend stays server-first and only turns interactive exactly where the browser adds value.',
];

export default async function Home() {
  const events = await listEvents();

  return (
    <main className="marketing-page">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">High-concurrency checkout showcase</p>
          <h1 className="hero__title">
            One fast buying moment. One clear domain rule. Zero fake frontend
            ceremony.
          </h1>
          <p className="hero__description">
            This catalog is built to show how a small product slice can still
            express strong architectural judgment: App Router, guest checkout,
            async persistence, and real-time order tracking.
          </p>
          <div className="hero__actions">
            <Link
              className="button button--primary"
              href={`/events/${events[0]?.id ?? ''}`}
            >
              Browse live events
            </Link>
            <a
              className="button button--ghost"
              href="#architecture"
            >
              Review architecture
            </a>
          </div>
          <dl className="metric-row">
            <div className="metric-card">
              <dt>Event city</dt>
              <dd>{events[0]?.city ?? 'Warsaw'}</dd>
            </div>
            <div className="metric-card">
              <dt>Catalog size</dt>
              <dd>{events.length} live drops</dd>
            </div>
            <div className="metric-card">
              <dt>Identity rule</dt>
              <dd>1 email = 1 ticket</dd>
            </div>
          </dl>
        </div>

        <aside className="hero__panel">
          <p className="hero__panel-label">How the frontend behaves</p>
          <p className="hero__panel-code">
            Select event → review details → submit email → watch live order
            completion
          </p>
          <p className="hero__panel-copy">
            The user no longer types a raw ticket identifier. Event metadata is
            fetched from the backend and the transactional flow carries the
            event identity implicitly.
          </p>
          <div className="hero__panel-stack">
            <span>Next.js App Router</span>
            <span>NestJS + BullMQ</span>
            <span>Redis + PostgreSQL</span>
            <span>SSE order updates</span>
          </div>
        </aside>
      </section>

      <section className="section-grid" id="architecture">
        <div className="section-heading">
          <p className="eyebrow">Why this frontend exists</p>
          <h2>Built to expose judgment, not just component syntax.</h2>
          <p>
            The point of this frontend is to demonstrate how a React application
            can stay product-shaped and resilient while still respecting the
            concurrency model of the backend.
          </p>
        </div>

        <div className="feature-grid">
          {architectureSignals.map((signal) => (
            <article className="feature-card" key={signal.title}>
              <h3>{signal.title}</h3>
              <p>{signal.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-grid">
        <div className="section-heading">
          <p className="eyebrow">Available events</p>
          <h2>Choose an event before entering the purchase flow.</h2>
          <p>
            The catalog is loaded from the backend so the UI can render a real
            selection flow instead of exposing infrastructure identifiers.
          </p>
        </div>

        <div className="feature-grid">
          {events.map((event) => (
            <article className="feature-card feature-card--event" key={event.id}>
              <p className="feature-card__meta">
                {event.city} · {formatEventDate(event.startsAt)}
              </p>
              <h3>{event.name}</h3>
              <p>{event.teaser}</p>
              <div className="feature-card__footer">
                <span className="status-pill" data-status="pending">
                  {event.remainingInventory} tickets left
                </span>
                <Link className="button button--ghost" href={`/events/${event.id}`}>
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-grid section-grid--split">
        <article className="timeline-card">
          <p className="eyebrow">User journey</p>
          <ol className="timeline-list">
            <li>
              <strong>Browse the event</strong>
              <span>
                The landing page explains what is being sold and what rules the
                customer is agreeing to.
              </span>
            </li>
            <li>
              <strong>Submit guest checkout</strong>
              <span>
                The API reserves inventory immediately and returns an `orderId`
                while persistence continues in the background.
              </span>
            </li>
            <li>
              <strong>Observe live order progression</strong>
              <span>
                The status page starts with a server read and upgrades into a
                live SSE stream for the terminal transition.
              </span>
            </li>
          </ol>
        </article>

        <article className="principles-card">
          <p className="eyebrow">Architectural principles</p>
          <ul className="principles-list">
            {principles.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
