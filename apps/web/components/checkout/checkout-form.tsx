'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { SyntheticEvent } from 'react';
import { ApiError } from '@/lib/api/client';
import { buyTicket } from '@/lib/api/tickets';

export default function CheckoutForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ticketId, setTicketId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

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
        return;
      }

      setErrorMessage('Unexpected error. Please try again.');
    }
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <div className="checkout-form__intro">
        <p className="checkout-form__eyebrow">Guest checkout</p>
        <h1 className="checkout-form__title">Reserve your ticket</h1>
        <p className="checkout-form__description">
          Submit a ticket identifier and your email to create a reservation.
        </p>
      </div>

      <div className="checkout-form__fields">
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

        <label className="checkout-form__field">
          <span>Email</span>
          <input
            autoComplete="email"
            className="checkout-form__input"
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

      <button className="checkout-form__submit" disabled={isPending} type="submit">
        {isPending ? 'Redirecting to order...' : 'Reserve ticket'}
      </button>
    </form>
  );
}
