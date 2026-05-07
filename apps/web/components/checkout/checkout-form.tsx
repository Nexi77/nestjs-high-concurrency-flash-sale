'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { SyntheticEvent } from 'react';
import { ApiError } from '@/lib/api/client';
import { buyTicket } from '@/lib/api/tickets';
import type { EventDetails } from '@/lib/api/types';

type CheckoutFormProps = {
  event?: EventDetails;
  initialTicketId?: string;
};

export default function CheckoutForm({
  event,
  initialTicketId = '',
}: CheckoutFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ticketId, setTicketId] = useState(event?.id ?? initialTicketId);
  const [customerEmail, setCustomerEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const normalizedEmail = customerEmail.trim().toLowerCase();

    try {
      const response = await buyTicket({
        ticketId: ticketId.trim(),
        customerEmail: normalizedEmail,
      });

      startTransition(() => {
        router.push(`/order/${response.orderId}`);
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      setErrorMessage('Unexpected error. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <div className="checkout-form__intro">
        <p className="checkout-form__eyebrow">Guest checkout</p>
        <h1 className="checkout-form__title">Reserve your ticket</h1>
        <p className="checkout-form__description">
          {event
            ? `You are reserving a ticket for ${event.name}. The backend will respond immediately and finish persistence asynchronously.`
            : 'Submit the event ticket identifier and your email to create a reservation. The backend will respond immediately and finish persistence asynchronously.'}
        </p>
      </div>

      {event ? (
        <div className="checkout-form__summary">
          <div className="checkout-form__summary-item">
            <span>Event</span>
            <strong>{event.name}</strong>
          </div>
          <div className="checkout-form__summary-item">
            <span>Venue</span>
            <strong>{event.venue}</strong>
          </div>
          <div className="checkout-form__summary-item">
            <span>Inventory</span>
            <strong>{event.remainingInventory} tickets left</strong>
          </div>
        </div>
      ) : null}

      <div className="checkout-form__fields">
        {event ? null : (
          <label className="checkout-form__field">
            <span>Ticket ID</span>
            <input
              autoComplete="off"
              className="checkout-form__input"
              name="ticketId"
              onChange={(event) => setTicketId(event.target.value)}
              placeholder="96b3eb06-d57d-4df7-963f-eb4e17d2786b"
              required
              value={ticketId}
            />
          </label>
        )}

        <label className="checkout-form__field">
          <span>Email</span>
          <input
            autoComplete="email"
            className="checkout-form__input"
            disabled={isSubmitting || isPending}
            name="customerEmail"
            onChange={(event) => setCustomerEmail(event.target.value)}
            placeholder="name@example.com"
            required
            type="email"
            value={customerEmail}
          />
        </label>
      </div>

      {errorMessage ? (
        <p className="checkout-form__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        className="checkout-form__submit"
        disabled={isSubmitting || isPending}
        type="submit"
      >
        {isSubmitting || isPending ? 'Securing reservation...' : 'Reserve ticket'}
      </button>
    </form>
  );
}
