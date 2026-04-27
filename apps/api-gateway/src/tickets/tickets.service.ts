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

  async buyTicket(ticketId: string, customerEmail: string) {
    const result = await this.redisService.tryBuyTicket(
      ticketId,
      customerEmail,
    );

    if (result === -1)
      throw new BadRequestException(
        'Customer has already reserved a ticket with this email',
      );
    if (result === 0) throw new BadRequestException('Tickets are sold out');

    try {
      await this.orderQueue.add(
        'create_order',
        { ticketId, customerEmail },
        {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    } catch (error) {
      await this.redisService.releaseTicketReservation(ticketId, customerEmail);
      throw error;
    }

    return {
      status: 'pending',
      message: 'Ticket reserved. Order is being processed.',
    };
  }
}
