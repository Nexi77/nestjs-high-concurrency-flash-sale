import { OrderJobData } from '@lib/common';
import { BadRequestException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '@redis/redis';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let redisService: jest.Mocked<
    Pick<
      RedisService,
      'tryBuyTicket' | 'releaseTicketReservation' | 'getClient'
    >
  >;
  let orderQueue: jest.Mocked<Pick<Queue<OrderJobData>, 'add'>>;
  let service: TicketsService;

  beforeEach(() => {
    redisService = {
      tryBuyTicket: jest.fn(),
      releaseTicketReservation: jest.fn(),
      getClient: jest.fn(),
    };

    orderQueue = {
      add: jest.fn(),
    };

    service = new TicketsService(
      redisService as unknown as RedisService,
      orderQueue as unknown as Queue<OrderJobData>,
    );
  });

  it('returns pending and enqueues order after successful reservation', async () => {
    redisService.tryBuyTicket.mockResolvedValue(1);
    orderQueue.add.mockResolvedValue({} as never);

    const result = await service.buyTicket('ticket-1', 'customer@example.com');

    expect(redisService.tryBuyTicket).toHaveBeenCalledWith(
      'ticket-1',
      'customer@example.com',
    );
    expect(orderQueue.add).toHaveBeenCalledWith(
      'create_order',
      {
        ticketId: 'ticket-1',
        customerEmail: 'customer@example.com',
      },
      expect.objectContaining({
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
      }),
    );
    expect(result).toEqual({
      status: 'pending',
      message: 'Ticket reserved. Order is being processed.',
    });
  });

  it('rejects duplicate reservations', async () => {
    redisService.tryBuyTicket.mockResolvedValue(-1);

    await expect(
      service.buyTicket('ticket-1', 'customer@example.com'),
    ).rejects.toThrow(
      new BadRequestException(
        'Customer has already reserved a ticket with this email',
      ),
    );

    expect(orderQueue.add).not.toHaveBeenCalled();
  });

  it('rejects when tickets are sold out', async () => {
    redisService.tryBuyTicket.mockResolvedValue(0);

    await expect(
      service.buyTicket('ticket-1', 'customer@example.com'),
    ).rejects.toThrow(new BadRequestException('Tickets are sold out'));

    expect(orderQueue.add).not.toHaveBeenCalled();
  });

  it('releases the reservation when queueing the order fails', async () => {
    redisService.tryBuyTicket.mockResolvedValue(1);
    redisService.releaseTicketReservation.mockResolvedValue();
    orderQueue.add.mockRejectedValue(new Error('queue unavailable'));

    await expect(
      service.buyTicket('ticket-1', 'customer@example.com'),
    ).rejects.toThrow('queue unavailable');

    expect(redisService.releaseTicketReservation).toHaveBeenCalledWith(
      'ticket-1',
      'customer@example.com',
    );
  });
});
