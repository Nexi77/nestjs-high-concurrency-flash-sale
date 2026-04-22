import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type RedisWithCommands = Redis & {
  buyTicket(
    stockKey: string,
    buyersKey: string,
    userId: string,
  ): Promise<number>;
};

const BUY_TICKET_LUA = `
  local stockKey = KEYS[1]
  local buyersKey = KEYS[2]
  local userId = ARGV[1]

  if redis.call("SISMEMBER", buyersKey, userId) == 1 then
    return -1
  end

  local currentStock = tonumber(redis.call("GET", stockKey) or "0")
  if currentStock <= 0 then
    return 0
  end

  redis.call("DECR", stockKey)
  redis.call("SADD", buyersKey, userId)
  return 1
`;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisWithCommands;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
    }) as RedisWithCommands;

    this.client.defineCommand('buyTicket', {
      numberOfKeys: 2,
      lua: BUY_TICKET_LUA,
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): RedisWithCommands {
    return this.client;
  }

  async tryBuyTicket(ticketId: string, userId: string): Promise<number> {
    const stockKey = `stock:${ticketId}`;
    const buyersKey = `buyers:${ticketId}`;

    const result = await this.client.buyTicket(stockKey, buyersKey, userId);
    return result;
  }
}
