import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrderStatusService } from './order-status.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, OrderStatusService],
  exports: [RedisService, OrderStatusService],
})
export class RedisModule {}
