import { Body, Controller, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('init')
  async initTickets(@Body('id') id: string, @Body('count') count: number) {
    return this.ticketsService.initTickets(id, count);
  }

  @Post('buy')
  async buyTicket(
    @Body('ticketId') ticketId: string,
    @Body('userId') userId: string,
  ) {
    return this.ticketsService.buyTicket(ticketId, userId);
  }
}
