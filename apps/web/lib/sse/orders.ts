import { getPublicEnv } from '@/lib/env/public';

export const ORDER_STATUS_UPDATED_EVENT = 'order-status-updated';
export const ORDER_STREAM_HEARTBEAT_EVENT = 'heartbeat';

export function createOrderStatusEventSource(orderId: string): EventSource {
  const { apiBaseUrl } = getPublicEnv();
  return new EventSource(`${apiBaseUrl}/orders/${orderId}/events`);
}
