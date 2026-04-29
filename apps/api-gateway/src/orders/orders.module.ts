import { DatabaseModule } from '@db/database';
import { Module } from '@nestjs/common';
import { RedisModule } from '@redis/redis';
import { OrderEventsService } from './order-events.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderEventsService],
})
export class OrdersModule {}
