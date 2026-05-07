import { apiFetch } from '@/lib/api/client';
import type { EventDetails, EventSummary } from '@/lib/api/types';

export async function listEvents(): Promise<EventSummary[]> {
  return apiFetch<EventSummary[]>('/events', {
    cache: 'no-store',
  });
}

export async function getEvent(eventId: string): Promise<EventDetails> {
  return apiFetch<EventDetails>(`/events/${eventId}`, {
    cache: 'no-store',
  });
}
