import { ValidationPipe } from '@nestjs/common';
import { BuyTicketDto } from '@lib/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

describe('TicketsController', () => {
  let ticketsService: jest.Mocked<Pick<TicketsService, 'buyTicket'>>;
  let controller: TicketsController;
  let validationPipe: ValidationPipe;

  beforeEach(() => {
    ticketsService = {
      buyTicket: jest.fn(),
    };

    controller = new TicketsController(ticketsService as TicketsService);
    validationPipe = new ValidationPipe({ whitelist: true, transform: true });
  });

  it('normalizes customerEmail before passing it to the service', async () => {
    ticketsService.buyTicket.mockResolvedValue({
      status: 'pending',
      message: 'Ticket reserved. Order is being processed.',
    });

    const dto = (await validationPipe.transform(
      {
        ticketId: '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
        customerEmail: '  Customer@Example.com ',
      },
      {
        type: 'body',
        metatype: BuyTicketDto,
      },
    )) as BuyTicketDto;

    await controller.buyTicket(dto);

    expect(ticketsService.buyTicket).toHaveBeenCalledWith(
      '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
      'customer@example.com',
    );
  });

  it('rejects invalid customerEmail at the API boundary', async () => {
    await expect(
      validationPipe.transform(
        {
          ticketId: '96b3eb06-d57d-4df7-963f-eb4e17d2786b',
          customerEmail: 'not-an-email',
        },
        {
          type: 'body',
          metatype: BuyTicketDto,
        },
      ),
    ).rejects.toThrow();

    expect(ticketsService.buyTicket).not.toHaveBeenCalled();
  });
});
