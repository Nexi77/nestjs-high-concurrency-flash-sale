import { DatabaseModule } from '@db/database';
import { Module } from '@nestjs/common';
import { RedisModule } from '@redis/redis';
import { EventsBootstrapService } from './events.bootstrap.service';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [DatabaseModule, RedisModule],
  controllers: [EventsController],
  providers: [EventsService, EventsBootstrapService],
})
export class EventsModule {}
