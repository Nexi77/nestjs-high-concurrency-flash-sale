import { OrderJobData } from '@lib/common';
import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '@redis/redis';
import { Queue } from 'bullmq';

@Injectable()
export class TicketsService {
  constructor(
    private readonly redisService: RedisService,
    @InjectQueue('order-queue')
    private readonly orderQueue: Queue<OrderJobData>,
  ) {}

  async initTickets(ticketId: string, count: number) {
    const client = this.redisService.getClient();
    const stockKey = `stock:${ticketId}`;
    const buyersKey = `buyers:${ticketId}`;

    await client.del(stockKey, buyersKey);
    await client.set(stockKey, count);

    return { message: `Initialized ${count} tickets for ${ticketId}` };
  }

  async buyTicket(ticketId: string, userId: string) {
    const result = await this.redisService.tryBuyTicket(ticketId, userId);

    if (result === -1)
      throw new BadRequestException('User has already bought a ticket');
    if (result === 0) throw new BadRequestException('Tickets are sold out');

    await this.orderQueue.add(
      'create_order',
      { ticketId, userId },
      {
        removeOnComplete: true,
        attempts: 3,
      },
    );

    return {
      status: 'pending',
      message: 'Ticket reserved. Order is being processed.',
    };
  }
}
