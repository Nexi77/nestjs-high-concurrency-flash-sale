import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class OrderStatusService {
  constructor(private readonly redisService: RedisService) {}

  async markPending(orderId: string): Promise<void> {
    await this.redisService.setPendingOrderStatus(orderId);
  }

  async clearPending(orderId: string): Promise<void> {
    await this.redisService.deletePendingOrderStatus(orderId);
  }

  async isPending(orderId: string): Promise<boolean> {
    return this.redisService.hasPendingOrderStatus(orderId);
  }
}
