import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { EventDetails } from '@/lib/api/types';
import { ApiError } from '@/lib/api/client';
import { buyTicket } from '@/lib/api/tickets';
import CheckoutForm from './checkout-form';

const push = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}));

jest.mock('@/lib/api/tickets', () => ({
  buyTicket: jest.fn(),
}));

const mockEvent: EventDetails = {
  id: '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
  slug: 'flash-sale-lab-warsaw',
  name: 'Flash Sale Lab',
  city: 'Warsaw',
  venue: 'Powisle Power Hall',
  startsAt: '2026-05-21T18:30:00.000Z',
  teaser: 'Teaser',
  description: 'Description',
  highlights: ['One', 'Two'],
  remainingInventory: 100,
};

describe('CheckoutForm', () => {
  beforeEach(() => {
    push.mockReset();
    jest.mocked(buyTicket).mockReset();
  });

  it('submits a normalized email and redirects to the order status page', async () => {
    jest.mocked(buyTicket).mockResolvedValue({
      orderId: 'd0f3ec41-f8b2-454d-b3db-acfd456f6fdb',
      status: 'pending',
      message: 'Ticket reserved. Order is being processed.',
    });

    render(<CheckoutForm event={mockEvent} />);

    expect(screen.queryByLabelText(/ticket id/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: '  Buyer@Example.com ' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /reserve ticket/i }));

    await waitFor(() => {
      expect(buyTicket).toHaveBeenCalledWith({
        ticketId: mockEvent.id,
        customerEmail: 'buyer@example.com',
      });
    });

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        '/order/d0f3ec41-f8b2-454d-b3db-acfd456f6fdb',
      );
    });
  });

  it('renders an API error message and re-enables the form state', async () => {
    jest
      .mocked(buyTicket)
      .mockRejectedValue(new ApiError('Tickets are sold out', 400));

    render(<CheckoutForm event={mockEvent} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'buyer@example.com' },
    });

    const submitButton = screen.getByRole('button', { name: /reserve ticket/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Tickets are sold out');
    });

    expect(push).not.toHaveBeenCalled();
    expect(submitButton).not.toBeDisabled();
  });
});
