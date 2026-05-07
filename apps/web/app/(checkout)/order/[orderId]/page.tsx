import { notFound } from 'next/navigation';
import OrderStatusStream from '@/components/checkout/order-status-stream';
import { ApiError } from '@/lib/api/client';
import { getOrderStatus } from '@/lib/api/orders';

type OrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function Order({ params }: OrderPageProps) {
  const { orderId } = await params;
  let orderStatus;

  try {
    orderStatus = await getOrderStatus(orderId, { cache: 'no-store' });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <main className="transaction-page">
      <section className="transaction-shell">
        <div className="transaction-panel transaction-panel--status">
          <OrderStatusStream
            initialStatus={orderStatus.status}
            orderId={orderStatus.orderId}
          />
        </div>

        <aside className="transaction-panel transaction-panel--guide">
          <p className="eyebrow">Order read model</p>
          <h2 className="transaction-panel__title">
            This view starts with truth, then upgrades to live transport.
          </h2>
          <p className="transaction-panel__copy">
            The page begins with a server-side status fetch. If the order is
            still pending, the client subscribes to SSE and waits for the worker
            to publish the terminal update.
          </p>
          <ul className="transaction-panel__list">
            <li>Initial state comes from `GET /orders/:orderId/status`.</li>
            <li>Redis tracks in-flight status and Pub/Sub transports updates.</li>
            <li>On SSE failure the client reconciles through a fresh status read.</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
