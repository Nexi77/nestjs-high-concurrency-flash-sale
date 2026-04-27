import type { BuyTicketRequest, BuyTicketResponse } from '@/lib/api/types';
import { apiFetch } from '@/lib/api/client';

export async function buyTicket(
  input: BuyTicketRequest,
): Promise<BuyTicketResponse> {
  return apiFetch<BuyTicketResponse>('/tickets/buy', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
