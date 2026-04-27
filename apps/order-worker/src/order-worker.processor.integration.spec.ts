import { OrderNotificationJobData } from '@lib/common';
import { OrderEntity } from '@db/database';
import { randomUUID } from 'node:crypto';
import { Queue } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { OrderProcessor } from './order-worker.processor';

describe('OrderProcessor integration', () => {
  let dataSource: DataSource;
  let orderRepository: Repository<OrderEntity>;
  let notificationQueue: jest.Mocked<
    Pick<Queue<OrderNotificationJobData>, 'add'>
  >;
  let processor: OrderProcessor;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'flash_sale_test',
      entities: [OrderEntity],
      synchronize: true,
    });

    await dataSource.initialize();
    orderRepository = dataSource.getRepository(OrderEntity);
  });

  beforeEach(async () => {
    await orderRepository.clear();

    notificationQueue = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    processor = new OrderProcessor(
      orderRepository,
      notificationQueue as unknown as Queue<OrderNotificationJobData>,
    );
  });

  afterAll(async () => {
    await dataSource?.destroy();
  });

  it('persists a new order and emits a notification', async () => {
    const result = await processor.process({
      id: 'job-1',
      data: {
        orderId: randomUUID(),
        ticketId: randomUUID(),
        customerEmail: 'customer@example.com',
      },
    } as never);

    const orders = await orderRepository.find();
    const [persistedOrder] = orders;

    expect(orders).toHaveLength(1);
    expect(persistedOrder.customerEmail).toBe('customer@example.com');
    expect(persistedOrder.status).toBe('confirmed');
    expect(notificationQueue.add).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ orderId: persistedOrder.id });
  });

  it('returns already_exists for a sequential duplicate and does not emit another notification', async () => {
    const ticketId = randomUUID();
    const customerEmail = 'duplicate@example.com';

    await processor.process({
      id: 'job-2',
      data: { orderId: randomUUID(), ticketId, customerEmail },
    } as never);

    const duplicateResult = await processor.process({
      id: 'job-3',
      data: { orderId: randomUUID(), ticketId, customerEmail },
    } as never);

    const orders = await orderRepository.findBy({ ticketId, customerEmail });
    const [persistedOrder] = orders;

    expect(orders).toHaveLength(1);
    expect(duplicateResult).toEqual({
      orderId: persistedOrder.id,
      status: 'already_exists',
    });
    expect(notificationQueue.add).toHaveBeenCalledTimes(1);
  });

  it('collapses concurrent duplicate jobs into a single persisted order', async () => {
    const ticketId = randomUUID();
    const customerEmail = 'concurrent@example.com';

    const results = await Promise.allSettled([
      processor.process({
        id: 'job-4',
        data: { orderId: randomUUID(), ticketId, customerEmail },
      } as never),
      processor.process({
        id: 'job-5',
        data: { orderId: randomUUID(), ticketId, customerEmail },
      } as never),
    ]);

    const orders = await orderRepository.findBy({ ticketId, customerEmail });
    const [persistedOrder] = orders;
    const fulfilled = results.filter(
      (
        result,
      ): result is PromiseFulfilledResult<{
        orderId: string;
        status?: string;
      }> => result.status === 'fulfilled',
    );

    expect(orders).toHaveLength(1);
    expect(fulfilled).toHaveLength(2);
    expect(fulfilled.map((result) => result.value.orderId)).toEqual([
      persistedOrder.id,
      persistedOrder.id,
    ]);
    expect(notificationQueue.add).toHaveBeenCalledTimes(1);
  });
});
