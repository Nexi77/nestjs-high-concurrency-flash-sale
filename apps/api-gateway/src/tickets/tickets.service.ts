import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '@redis/redis';

@Injectable()
export class TicketsService {
  constructor(private readonly redisService: RedisService) {}

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

    switch (result) {
      case -1:
        throw new BadRequestException('User has already bought a ticket');
      case 0:
        throw new BadRequestException('Tickets are sold out');
      default:
        return { message: 'Ticket purchased successfully', userId, ticketId };
    }
  }
}
