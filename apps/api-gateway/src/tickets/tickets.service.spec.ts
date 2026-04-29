import { OrderJobData } from '@lib/common';
import { BadRequestException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { OrderStatusService, RedisService } from '@redis/redis';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let redisService: jest.Mocked<
    Pick<
      RedisService,
      'tryBuyTicket' | 'releaseTicketReservation' | 'getClient'
    >
  >;
  let orderStatusService: jest.Mocked<
    Pick<OrderStatusService, 'markPending' | 'clearPending'>
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

    orderStatusService = {
      markPending: jest.fn(),
      clearPending: jest.fn(),
    };

    service = new TicketsService(
      redisService as unknown as RedisService,
      orderStatusService as unknown as OrderStatusService,
      orderQueue as unknown as Queue<OrderJobData>,
    );
  });

  it('returns pending and enqueues order after successful reservation', async () => {
    redisService.tryBuyTicket.mockResolvedValue(1);
    orderStatusService.markPending.mockResolvedValue();
    orderQueue.add.mockResolvedValue({} as never);

    const result = await service.buyTicket('ticket-1', 'customer@example.com');

    expect(redisService.tryBuyTicket).toHaveBeenCalledWith(
      'ticket-1',
      'customer@example.com',
    );
    expect(orderStatusService.markPending).toHaveBeenCalledWith(
      expect.any(String),
    );
    expect(orderQueue.add).toHaveBeenCalledWith(
      'create_order',
      expect.any(Object),
      expect.objectContaining({
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
      }),
    );
    const addCalls = orderQueue.add.mock.calls as [
      string,
      OrderJobData,
      unknown,
    ][];
    const [, queuedJob] = addCalls[0];

    expect(queuedJob.ticketId).toBe('ticket-1');
    expect(queuedJob.customerEmail).toBe('customer@example.com');
    expect(queuedJob.orderId).toEqual(expect.any(String));

    expect(result).toEqual({
      orderId: queuedJob.orderId,
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
    orderStatusService.markPending.mockResolvedValue();
    orderStatusService.clearPending.mockResolvedValue();
    orderQueue.add.mockRejectedValue(new Error('queue unavailable'));

    await expect(
      service.buyTicket('ticket-1', 'customer@example.com'),
    ).rejects.toThrow('queue unavailable');

    expect(redisService.releaseTicketReservation).toHaveBeenCalledWith(
      'ticket-1',
      'customer@example.com',
    );
    expect(orderStatusService.clearPending).toHaveBeenCalledWith(
      expect.any(String),
    );
  });
});
