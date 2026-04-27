import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { RedisService } from './redis.service';

describe('RedisService integration', () => {
  let service: RedisService;

  beforeAll(async () => {
    process.env.REDIS_CONNECT_TIMEOUT_MS = '1000';
    process.env.REDIS_MAX_RETRIES_PER_REQUEST = '1';

    const configService = {
      get: (key: string, defaultValue?: string | number) => {
        switch (key) {
          case 'REDIS_HOST':
            return process.env.REDIS_HOST ?? defaultValue;
          case 'REDIS_PORT':
            return process.env.REDIS_PORT
              ? Number(process.env.REDIS_PORT)
              : defaultValue;
          case 'REDIS_PASSWORD':
            return process.env.REDIS_PASSWORD;
          case 'REDIS_CONNECT_TIMEOUT_MS':
            return process.env.REDIS_CONNECT_TIMEOUT_MS
              ? Number(process.env.REDIS_CONNECT_TIMEOUT_MS)
              : defaultValue;
          case 'REDIS_MAX_RETRIES_PER_REQUEST':
            return process.env.REDIS_MAX_RETRIES_PER_REQUEST
              ? Number(process.env.REDIS_MAX_RETRIES_PER_REQUEST)
              : defaultValue;
          default:
            return defaultValue;
        }
      },
    };

    service = new RedisService(configService as ConfigService);
    service.onModuleInit();

    try {
      const client = service.getClient();
      const readinessKey = `redis-integration-readiness:${randomUUID()}`;

      await client.set(readinessKey, 'ready');
      await expect(client.get(readinessKey)).resolves.toBe('ready');
      await client.del(readinessKey);
    } catch {
      await service.onModuleDestroy().catch(() => undefined);
      throw new Error(
        'Redis integration tests require a reachable local Redis instance. Start infra/docker and ensure .env points to the running Redis service.',
      );
    }
  });

  afterAll(async () => {
    await service?.onModuleDestroy();
  });

  it('prevents duplicate reservations and sold-out overselling with real Redis', async () => {
    const ticketId = randomUUID();
    const customerEmail = 'integration@example.com';
    const client = service.getClient();
    const stockKey = `stock:${ticketId}`;
    const buyersKey = `buyers:${ticketId}`;

    await client.del(stockKey, buyersKey);
    await client.set(stockKey, 1);

    await expect(service.tryBuyTicket(ticketId, customerEmail)).resolves.toBe(
      1,
    );
    await expect(service.tryBuyTicket(ticketId, customerEmail)).resolves.toBe(
      -1,
    );
    await expect(
      service.tryBuyTicket(ticketId, 'second@example.com'),
    ).resolves.toBe(0);

    await expect(client.get(stockKey)).resolves.toBe('0');
    await expect(client.smembers(buyersKey)).resolves.toEqual([customerEmail]);
  });

  it('releases the reservation and restores stock when compensation runs', async () => {
    const ticketId = randomUUID();
    const customerEmail = 'rollback@example.com';
    const client = service.getClient();
    const stockKey = `stock:${ticketId}`;
    const buyersKey = `buyers:${ticketId}`;

    await client.del(stockKey, buyersKey);
    await client.set(stockKey, 1);

    await expect(service.tryBuyTicket(ticketId, customerEmail)).resolves.toBe(
      1,
    );

    await service.releaseTicketReservation(ticketId, customerEmail);

    await expect(client.get(stockKey)).resolves.toBe('1');
    await expect(client.smembers(buyersKey)).resolves.toEqual([]);
  });

  it('keeps stock bounded under concurrent buyers', async () => {
    const ticketId = randomUUID();
    const client = service.getClient();
    const stockKey = `stock:${ticketId}`;
    const buyersKey = `buyers:${ticketId}`;

    await client.del(stockKey, buyersKey);
    await client.set(stockKey, 2);

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        service.tryBuyTicket(ticketId, `buyer-${index}@example.com`),
      ),
    );

    const successfulReservations = results.filter((result) => result === 1);
    const soldOutResponses = results.filter((result) => result === 0);

    expect(successfulReservations).toHaveLength(2);
    expect(soldOutResponses).toHaveLength(3);
    await expect(client.get(stockKey)).resolves.toBe('0');
    await expect(client.scard(buyersKey)).resolves.toBe(2);
  });
});
