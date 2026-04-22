import { Body, Controller, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { BuyTicketDto, InitTicketsDto } from '@lib/common';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('init')
  async initTickets(@Body() initTicketsDto: InitTicketsDto) {
    return this.ticketsService.initTickets(
      initTicketsDto.id,
      initTicketsDto.count,
    );
  }

  @Post('buy')
  async buyTicket(@Body() buyTicketDto: BuyTicketDto) {
    return this.ticketsService.buyTicket(
      buyTicketDto.ticketId,
      buyTicketDto.userId,
    );
  }
}
