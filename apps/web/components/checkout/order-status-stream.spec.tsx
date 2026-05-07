import { act, render, screen, waitFor } from '@testing-library/react';
import { getOrderStatus } from '@/lib/api/orders';
import {
  createOrderStatusEventSource,
  ORDER_STREAM_HEARTBEAT_EVENT,
  ORDER_STATUS_UPDATED_EVENT,
} from '@/lib/sse/orders';
import OrderStatusStream from './order-status-stream';

const refresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh,
  }),
}));

jest.mock('@/lib/api/orders', () => ({
  getOrderStatus: jest.fn(),
}));

jest.mock('@/lib/sse/orders', () => ({
  createOrderStatusEventSource: jest.fn(),
  ORDER_STREAM_HEARTBEAT_EVENT: 'heartbeat',
  ORDER_STATUS_UPDATED_EVENT: 'order-status-updated',
}));

class MockEventSource {
  static latestInstance: MockEventSource | null = null;

  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private readonly listeners = new Map<string, Set<EventListener>>();

  constructor() {
    MockEventSource.latestInstance = this;
  }

  addEventListener(type: string, listener: EventListener) {
    const set = this.listeners.get(type) ?? new Set<EventListener>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: EventListener) {
    const set = this.listeners.get(type);
    set?.delete(listener);
  }

  close = jest.fn();

  emit(type: string, payload: unknown) {
    const event = new MessageEvent(type, {
      data: JSON.stringify(payload),
    });

    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe('OrderStatusStream', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    refresh.mockReset();
    jest.mocked(getOrderStatus).mockReset();
    jest
      .mocked(createOrderStatusEventSource)
      .mockImplementation(() => new MockEventSource() as unknown as EventSource);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('updates to completed when the SSE stream emits the terminal status', async () => {
    render(
      <OrderStatusStream
        initialStatus="pending"
        orderId="96b3eb06-d57d-4df7-963f-eb4e17d2786b"
      />,
    );

    const source = MockEventSource.latestInstance;

    expect(source).not.toBeNull();

    act(() => {
      source?.onopen?.();
      source?.emit(ORDER_STATUS_UPDATED_EVENT, {
        orderId: '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
        status: 'completed',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/live tracking is complete/i)).toBeInTheDocument();
    });

    expect(refresh).toHaveBeenCalled();
  });

  it('reconciles through getOrderStatus after a stream failure and refreshes when the backend already sees completion', async () => {
    jest.mocked(getOrderStatus).mockResolvedValue({
      orderId: '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
      status: 'completed',
    });

    render(
      <OrderStatusStream
        initialStatus="pending"
        orderId="96b3eb06-d57d-4df7-963f-eb4e17d2786b"
      />,
    );

    const source = MockEventSource.latestInstance;

    expect(source).not.toBeNull();

    act(() => {
      source?.onerror?.();
    });

    await waitFor(() => {
      expect(getOrderStatus).toHaveBeenCalledWith(
        '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
        { cache: 'no-store' },
      );
    });

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });

    expect(screen.getByText(/terminal state/i)).toBeInTheDocument();
  });

  it('records the latest heartbeat timestamp while the stream stays open', async () => {
    render(
      <OrderStatusStream
        initialStatus="pending"
        orderId="96b3eb06-d57d-4df7-963f-eb4e17d2786b"
      />,
    );

    const source = MockEventSource.latestInstance;

    act(() => {
      source?.onopen?.();
      source?.emit(ORDER_STREAM_HEARTBEAT_EVENT, {
        timestamp: '2026-05-07T12:30:00.000Z',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/last heartbeat/i)).toBeInTheDocument();
    });
  });
});
