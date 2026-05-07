import Link from 'next/link';

export default function Checkout() {
  return (
    <main className="transaction-page">
      <section className="transaction-shell">
        <aside className="transaction-panel transaction-panel--guide">
          <p className="eyebrow">Event selection required</p>
          <h2 className="transaction-panel__title">
            Choose an event first, then enter checkout from its detail view.
          </h2>
          <p className="transaction-panel__copy">
            The main flow now starts from the event catalog so the user never
            has to type a raw ticket identifier by hand.
          </p>
          <ul className="transaction-panel__list">
            <li>Browse available events on the landing page.</li>
            <li>Open an event detail view with metadata fetched from the API.</li>
            <li>Submit email-only guest checkout from that page.</li>
          </ul>
          <Link className="button button--primary" href="/">
            Return to event catalog
          </Link>
        </aside>
      </section>
    </main>
  );
}
