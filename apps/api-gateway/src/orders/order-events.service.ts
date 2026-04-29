import { GetOrderStatusResponse, OrderStatusUpdatedEvent } from '@lib/common';
import { OrderEventsBusService } from '@redis/redis';
import {
  Injectable,
  MessageEvent,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { OrdersService } from './orders.service';

const HEARTBEAT_INTERVAL_MS = 15000;

type OrderStreamEntry = {
  observers: number;
  listeners: Set<(event: MessageEvent) => void>;
};

@Injectable()
export class OrderEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly orderStreams = new Map<string, OrderStreamEntry>();
  private unsubscribeFromBus?: () => void;

  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderEventsBusService: OrderEventsBusService,
  ) {}

  onModuleInit(): void {
    this.unsubscribeFromBus = this.orderEventsBusService.subscribe((event) => {
      this.broadcast(event);
    });
  }

  onModuleDestroy(): void {
    this.unsubscribeFromBus?.();
    this.orderStreams.clear();
  }

  streamOrderStatus(orderId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let teardown: () => void = () => undefined;
      let closed = false;
      const heartbeatInterval = setInterval(() => {
        subscriber.next(this.toHeartbeatEvent());
      }, HEARTBEAT_INTERVAL_MS);

      void this.attachSubscriber(orderId, subscriber).then((nextTeardown) => {
        if (closed) {
          nextTeardown();
          return;
        }

        teardown = nextTeardown;
      });

      return () => {
        closed = true;
        clearInterval(heartbeatInterval);
        teardown();
      };
    });
  }

  private async attachSubscriber(
    orderId: string,
    subscriber: {
      next: (value: MessageEvent) => void;
      error: (error: unknown) => void;
      complete: () => void;
    },
  ): Promise<() => void> {
    try {
      const currentStatus = await this.ordersService.getOrderStatus(orderId);

      if (currentStatus.status === 'completed') {
        subscriber.next(this.toMessageEvent(currentStatus));
        subscriber.complete();
        return () => undefined;
      }

      const entry = this.getOrCreateEntry(orderId);
      const listener = (event: MessageEvent) => {
        subscriber.next(event);

        const payload = event.data as OrderStatusUpdatedEvent;
        if (payload.status === 'completed') {
          subscriber.complete();
        }
      };

      entry.observers += 1;
      entry.listeners.add(listener);

      return () => {
        const currentEntry = this.orderStreams.get(orderId);

        if (!currentEntry) {
          return;
        }

        currentEntry.listeners.delete(listener);
        currentEntry.observers -= 1;

        if (currentEntry.observers <= 0) {
          this.orderStreams.delete(orderId);
        }
      };
    } catch (error) {
      subscriber.error(error);
      return () => undefined;
    }
  }

  private broadcast(event: OrderStatusUpdatedEvent): void {
    const entry = this.orderStreams.get(event.orderId);

    if (!entry) {
      return;
    }

    const messageEvent = this.toMessageEvent(event);
    for (const listener of entry.listeners) {
      listener(messageEvent);
    }

    if (event.status === 'completed') {
      this.orderStreams.delete(event.orderId);
    }
  }

  private getOrCreateEntry(orderId: string): OrderStreamEntry {
    const existingEntry = this.orderStreams.get(orderId);

    if (existingEntry) {
      return existingEntry;
    }

    const newEntry: OrderStreamEntry = {
      observers: 0,
      listeners: new Set(),
    };

    this.orderStreams.set(orderId, newEntry);
    return newEntry;
  }

  private toMessageEvent(
    status: GetOrderStatusResponse | OrderStatusUpdatedEvent,
  ): MessageEvent {
    return {
      type: 'order-status-updated',
      data: {
        orderId: status.orderId,
        status: status.status,
      } satisfies OrderStatusUpdatedEvent,
    };
  }

  private toHeartbeatEvent(): MessageEvent {
    return {
      type: 'heartbeat',
      data: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
