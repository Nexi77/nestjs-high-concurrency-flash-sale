import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrderEventsBusService } from './order-events-bus.service';
import { OrderStatusService } from './order-status.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, OrderStatusService, OrderEventsBusService],
  exports: [RedisService, OrderStatusService, OrderEventsBusService],
})
export class RedisModule {}
