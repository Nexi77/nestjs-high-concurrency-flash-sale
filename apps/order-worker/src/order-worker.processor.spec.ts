import { OrderNotificationJobData } from '@lib/common';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { OrderEntity } from '@db/database';
import { OrderProcessor } from './order-worker.processor';

describe('OrderProcessor', () => {
  let orderRepository: jest.Mocked<
    Pick<Repository<OrderEntity>, 'findOne' | 'create'>
  > & {
    manager: {
      transaction: jest.Mock;
    };
  };
  let notificationQueue: jest.Mocked<
    Pick<Queue<OrderNotificationJobData>, 'add'>
  >;
  let processor: OrderProcessor;

  beforeEach(() => {
    orderRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    notificationQueue = {
      add: jest.fn(),
    };

    processor = new OrderProcessor(
      orderRepository as unknown as Repository<OrderEntity>,
      notificationQueue as unknown as Queue<OrderNotificationJobData>,
    );
  });

  it('returns already_exists when order is already persisted', async () => {
    const existingOrder: OrderEntity = {
      id: 'order-1',
      ticketId: 'ticket-1',
      customerEmail: 'customer@example.com',
      status: 'confirmed',
      createdAt: new Date('2026-04-27T10:00:00.000Z'),
    };

    orderRepository.findOne.mockResolvedValue(existingOrder);

    const result = await processor.process({
      id: 'job-1',
      data: {
        orderId: 'order-1',
        ticketId: 'ticket-1',
        customerEmail: 'customer@example.com',
      },
    } as never);

    expect(result).toEqual({
      orderId: 'order-1',
      status: 'already_exists',
    });
    expect(notificationQueue.add).not.toHaveBeenCalled();
    expect(orderRepository.manager.transaction).not.toHaveBeenCalled();
  });

  it('persists a new order and sends notification', async () => {
    const createdOrder: OrderEntity = {
      id: 'order-2',
      ticketId: 'ticket-1',
      customerEmail: 'customer@example.com',
      status: 'confirmed',
      createdAt: new Date('2026-04-27T10:00:00.000Z'),
    };

    orderRepository.findOne.mockResolvedValue(null);
    orderRepository.create.mockReturnValue(createdOrder);
    orderRepository.manager.transaction.mockImplementation(
      async (
        callback: (transactionalEntityManager: {
          save: jest.Mock;
        }) => Promise<void>,
      ) => {
        const transactionalEntityManager = {
          save: jest.fn().mockResolvedValue(createdOrder),
        };

        await callback(transactionalEntityManager);
      },
    );
    notificationQueue.add.mockResolvedValue({} as never);

    const result = await processor.process({
      id: 'job-2',
      data: {
        orderId: 'order-2',
        ticketId: 'ticket-1',
        customerEmail: 'customer@example.com',
      },
    } as never);

    expect(orderRepository.create).toHaveBeenCalledWith({
      id: 'order-2',
      ticketId: 'ticket-1',
      customerEmail: 'customer@example.com',
      status: 'confirmed',
    });
    expect(notificationQueue.add).toHaveBeenCalledWith('send_notification', {
      ticketId: 'ticket-1',
      customerEmail: 'customer@example.com',
      orderId: 'order-2',
      timestamp: '2026-04-27T10:00:00.000Z',
    });
    expect(result).toEqual({ orderId: 'order-2' });
  });

  it('returns the persisted order when a concurrent write hits the unique constraint', async () => {
    const persistedOrder: OrderEntity = {
      id: 'order-3',
      ticketId: 'ticket-1',
      customerEmail: 'customer@example.com',
      status: 'confirmed',
      createdAt: new Date('2026-04-27T10:00:00.000Z'),
    };

    orderRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(persistedOrder);
    orderRepository.create.mockReturnValue(persistedOrder);
    orderRepository.manager.transaction.mockRejectedValue({
      code: '23505',
    });

    const result = await processor.process({
      id: 'job-3',
      data: {
        orderId: 'order-999',
        ticketId: 'ticket-1',
        customerEmail: 'customer@example.com',
      },
    } as never);

    expect(result).toEqual({
      orderId: 'order-3',
      status: 'already_exists',
    });
    expect(notificationQueue.add).not.toHaveBeenCalled();
  });
});
