import { OrderStatusUpdatedEvent } from '@lib/common';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

const ORDER_STATUS_UPDATES_CHANNEL = 'order-status-updates';

@Injectable()
export class OrderEventsBusService implements OnModuleInit, OnModuleDestroy {
  private publisher!: Redis;
  private subscriber!: Redis;
  private readonly listeners = new Set<
    (event: OrderStatusUpdatedEvent) => void | Promise<void>
  >();

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    const client = this.redisService.getClient();
    this.publisher = client.duplicate();
    this.subscriber = client.duplicate();

    this.subscriber.on('message', (channel, payload) => {
      if (channel !== ORDER_STATUS_UPDATES_CHANNEL) {
        return;
      }

      const event = JSON.parse(payload) as OrderStatusUpdatedEvent;
      for (const listener of this.listeners) {
        void listener(event);
      }
    });

    await this.subscriber.subscribe(ORDER_STATUS_UPDATES_CHANNEL);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.unsubscribe(ORDER_STATUS_UPDATES_CHANNEL);
      await this.subscriber.quit();
    }

    if (this.publisher) {
      await this.publisher.quit();
    }
  }

  async publishStatusUpdated(event: OrderStatusUpdatedEvent): Promise<void> {
    await this.publisher.publish(
      ORDER_STATUS_UPDATES_CHANNEL,
      JSON.stringify(event),
    );
  }

  subscribe(
    listener: (event: OrderStatusUpdatedEvent) => void | Promise<void>,
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}
