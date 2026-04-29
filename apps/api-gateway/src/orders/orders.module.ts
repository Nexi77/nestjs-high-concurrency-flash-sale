import { DatabaseModule } from '@db/database';
import { Module } from '@nestjs/common';
import { RedisModule } from '@redis/redis';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
