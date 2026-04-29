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
    <main className="order-page">
      <OrderStatusStream
        initialStatus={orderStatus.status}
        orderId={orderStatus.orderId}
      />
    </main>
  );
}
