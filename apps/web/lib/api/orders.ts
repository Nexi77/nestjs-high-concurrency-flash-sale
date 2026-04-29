import { apiFetch } from '@/lib/api/client';
import type { GetOrderStatusResponse } from '@/lib/api/types';

export async function getOrderStatus(
  orderId: string,
  init?: RequestInit,
): Promise<GetOrderStatusResponse> {
  return apiFetch<GetOrderStatusResponse>(`/orders/${orderId}/status`, init);
}
