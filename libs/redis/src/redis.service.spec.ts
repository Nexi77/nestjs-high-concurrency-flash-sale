import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

const mockRedisClient = {
  defineCommand: jest.fn(),
  buyTicket: jest.fn(),
  releaseTicketReservation: jest.fn(),
  quit: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn(() => mockRedisClient),
}));

describe('RedisService', () => {
  let configService: Pick<ConfigService, 'get'>;
  let service: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();

    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'REDIS_HOST':
            return 'redis-host';
          case 'REDIS_PORT':
            return 6380;
          case 'REDIS_PASSWORD':
            return 'secret';
          case 'REDIS_CONNECT_TIMEOUT_MS':
            return 1000;
          case 'REDIS_MAX_RETRIES_PER_REQUEST':
            return 2;
          default:
            return undefined;
        }
      }),
    };

    service = new RedisService(configService as unknown as ConfigService);
    service.onModuleInit();
  });

  it('creates Redis client and registers Lua commands on module init', () => {
    const redisConstructor = Redis as unknown as jest.Mock;
    const defineCommandCalls = mockRedisClient.defineCommand.mock.calls as [
      string,
      { numberOfKeys: number; lua: string },
    ][];
    const buyTicketCommand = defineCommandCalls.find(
      ([commandName]) => commandName === 'buyTicket',
    );
    const releaseTicketReservationCommand = defineCommandCalls.find(
      ([commandName]) => commandName === 'releaseTicketReservation',
    );

    expect(redisConstructor).toHaveBeenCalledWith({
      host: 'redis-host',
      port: 6380,
      password: 'secret',
      connectTimeout: 1000,
      maxRetriesPerRequest: 2,
    });
    expect(buyTicketCommand).toBeDefined();
    expect(releaseTicketReservationCommand).toBeDefined();
    expect(buyTicketCommand?.[1].numberOfKeys).toBe(2);
    expect(buyTicketCommand?.[1].lua).toContain('SADD');
    expect(releaseTicketReservationCommand?.[1].numberOfKeys).toBe(2);
    expect(releaseTicketReservationCommand?.[1].lua).toContain('SREM');
    expect(releaseTicketReservationCommand?.[1].lua).toContain('INCR');
  });

  it('uses ticket-scoped Redis keys when reserving a ticket', async () => {
    mockRedisClient.buyTicket.mockResolvedValue(1);

    await service.tryBuyTicket('ticket-1', 'customer@example.com');

    expect(mockRedisClient.buyTicket).toHaveBeenCalledWith(
      'stock:ticket-1',
      'buyers:ticket-1',
      'customer@example.com',
    );
  });

  it('uses ticket-scoped Redis keys when releasing a reservation', async () => {
    mockRedisClient.releaseTicketReservation.mockResolvedValue(1);

    await service.releaseTicketReservation('ticket-1', 'customer@example.com');

    expect(mockRedisClient.releaseTicketReservation).toHaveBeenCalledWith(
      'stock:ticket-1',
      'buyers:ticket-1',
      'customer@example.com',
    );
  });

  it('closes the Redis client on module destroy', async () => {
    mockRedisClient.quit.mockResolvedValue('OK');

    await service.onModuleDestroy();

    expect(mockRedisClient.quit).toHaveBeenCalled();
  });
});
