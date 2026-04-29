'use client';

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { getOrderStatus } from '@/lib/api/orders';
import type { OrderStatus, OrderStatusUpdatedEvent } from '@/lib/api/types';
import {
  createOrderStatusEventSource,
  ORDER_STREAM_HEARTBEAT_EVENT,
  ORDER_STATUS_UPDATED_EVENT,
} from '@/lib/sse/orders';

const STREAM_RETRY_BASE_DELAY_MS = 2000;
const STREAM_RETRY_MAX_ATTEMPTS = 5;

type OrderStatusStreamProps = {
  orderId: string;
  initialStatus: OrderStatus;
};

export default function OrderStatusStream({
  orderId,
  initialStatus,
}: OrderStatusStreamProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const reconnectTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'listening' | 'reconnecting' | 'closed' | 'errored'
  >(initialStatus === 'pending' ? 'connecting' : 'closed');
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null);

  const handleStatusUpdated = useEffectEvent((event: MessageEvent<string>) => {
    const payload = JSON.parse(event.data) as OrderStatusUpdatedEvent;
    setStatus(payload.status);
    setRetryAttempt(0);

    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (payload.status === 'completed') {
      setConnectionState('closed');
      startTransition(() => {
        router.refresh();
      });
    }
  });

  const handleHeartbeat = useEffectEvent((event: MessageEvent<string>) => {
    const payload = JSON.parse(event.data) as { timestamp: string };
    setLastHeartbeatAt(payload.timestamp);
    setConnectionState('listening');
  });

  const scheduleReconnect = useEffectEvent(async () => {
    const nextRetryAttempt = retryAttempt + 1;

    if (nextRetryAttempt > STREAM_RETRY_MAX_ATTEMPTS) {
      setConnectionState('errored');
      return;
    }

    setConnectionState('reconnecting');

    try {
      const latestStatus = await getOrderStatus(orderId, { cache: 'no-store' });
      setStatus(latestStatus.status);

      if (latestStatus.status === 'completed') {
        setConnectionState('closed');
        startTransition(() => {
          router.refresh();
        });
        return;
      }
    } catch {
      // Retry will continue after the backoff delay below.
    }

    const delay = STREAM_RETRY_BASE_DELAY_MS * nextRetryAttempt;
    reconnectTimerRef.current = window.setTimeout(() => {
      setRetryAttempt(nextRetryAttempt);
      setConnectionState('connecting');
      reconnectTimerRef.current = null;
    }, delay);
  });

  useEffect(() => {
    if (status !== 'pending') {
      return;
    }

    const eventSource = createOrderStatusEventSource(orderId);
    let isClosed = false;

    eventSource.onopen = () => {
      setRetryAttempt(0);
      setConnectionState('listening');
    };

    eventSource.addEventListener(
      ORDER_STATUS_UPDATED_EVENT,
      handleStatusUpdated as EventListener,
    );
    eventSource.addEventListener(
      ORDER_STREAM_HEARTBEAT_EVENT,
      handleHeartbeat as EventListener,
    );
    eventSource.onerror = () => {
      if (isClosed) {
        return;
      }

      isClosed = true;
      eventSource.close();
      void scheduleReconnect();
    };

    return () => {
      isClosed = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      eventSource.removeEventListener(
        ORDER_STATUS_UPDATED_EVENT,
        handleStatusUpdated as EventListener,
      );
      eventSource.removeEventListener(
        ORDER_STREAM_HEARTBEAT_EVENT,
        handleHeartbeat as EventListener,
      );
      eventSource.close();
    };
  }, [orderId, retryAttempt, status]);

  return (
    <div className="order-status-stream">
      <p className="order-status-stream__eyebrow">Order tracking</p>
      <h1 className="order-status-stream__title">Order {orderId}</h1>
      <p className="order-status-stream__description">
        Current status: <strong>{status}</strong>.
      </p>
      <p className="order-status-stream__description">
        {connectionState === 'listening'
          ? 'Listening for live status updates from the server.'
          : null}
        {connectionState === 'connecting'
          ? 'Opening the live status stream.'
          : null}
        {connectionState === 'reconnecting'
          ? 'The live stream dropped. Re-checking the latest order state and preparing to reconnect.'
          : null}
        {connectionState === 'closed'
          ? 'Live tracking is complete for this order.'
          : null}
        {connectionState === 'errored'
          ? 'Live tracking was interrupted. Refresh to reconcile the latest status.'
          : null}
      </p>
      {lastHeartbeatAt ? (
        <p className="order-status-stream__meta">
          Last heartbeat: {new Date(lastHeartbeatAt).toLocaleTimeString()}
        </p>
      ) : null}
    </div>
  );
}
