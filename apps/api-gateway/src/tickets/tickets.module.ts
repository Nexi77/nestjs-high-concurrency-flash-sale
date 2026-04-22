import { Module } from '@nestjs/common';
import { RedisModule } from '@redis/redis';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    RedisModule,
    BullModule.registerQueue({
      name: 'order-queue',
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
