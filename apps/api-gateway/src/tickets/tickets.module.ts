import { Module } from '@nestjs/common';
import { RedisModule } from '@redis/redis';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [RedisModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
