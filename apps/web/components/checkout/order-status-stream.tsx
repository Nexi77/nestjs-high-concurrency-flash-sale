'use client';

import type { OrderStatus } from '@/lib/api/types';

type OrderStatusStreamProps = {
  orderId: string;
  initialStatus: OrderStatus;
};

export default function OrderStatusStream({
  orderId,
  initialStatus,
}: OrderStatusStreamProps) {
  return (
    <div className="order-status-stream">
      <p className="order-status-stream__eyebrow">Order tracking</p>
      <h1 className="order-status-stream__title">Order {orderId}</h1>
      <p className="order-status-stream__description">
        Current status: <strong>{initialStatus}</strong>.
      </p>
      <p className="order-status-stream__description">
        SSE status tracking will live here in the next step. For now the page
        is backed by the server status endpoint.
      </p>
    </div>
  );
}
