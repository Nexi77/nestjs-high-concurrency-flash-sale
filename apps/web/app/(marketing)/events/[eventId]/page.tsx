import Link from 'next/link';
import { notFound } from 'next/navigation';
import CheckoutForm from '@/components/checkout/checkout-form';
import { ApiError } from '@/lib/api/client';
import { getEvent } from '@/lib/api/events';
import { formatEventDate } from '@/lib/utils/format';

type EventDetailsPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { eventId } = await params;
  let event;

  try {
    event = await getEvent(eventId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="transaction-page">
      <section className="transaction-shell">
        <article className="transaction-panel transaction-panel--guide">
          <p className="eyebrow">Event details</p>
          <h1 className="transaction-panel__title">{event.name}</h1>
          <p className="transaction-panel__copy">{event.description}</p>
          <div className="event-meta-grid">
            <div className="metric-card">
              <dt>City</dt>
              <dd>{event.city}</dd>
            </div>
            <div className="metric-card">
              <dt>Venue</dt>
              <dd>{event.venue}</dd>
            </div>
            <div className="metric-card">
              <dt>Starts</dt>
              <dd>{formatEventDate(event.startsAt)}</dd>
            </div>
            <div className="metric-card">
              <dt>Available</dt>
              <dd>{event.remainingInventory} tickets</dd>
            </div>
          </div>
          <ul className="transaction-panel__list">
            {event.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <Link className="button button--ghost" href="/">
            Back to event catalog
          </Link>
        </article>

        <div className="transaction-panel transaction-panel--form">
          <CheckoutForm event={event} />
        </div>
      </section>
    </main>
  );
}
