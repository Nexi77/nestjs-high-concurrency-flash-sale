import { EventEntity } from '@db/database';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '@redis/redis';
import { Repository } from 'typeorm';
import { DEFAULT_EVENTS } from './default-events';

@Injectable()
export class EventsBootstrapService implements OnModuleInit {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    const existingCount = await this.eventRepository.count();

    if (existingCount === 0) {
      const demoEntities = DEFAULT_EVENTS.map((event) =>
        this.eventRepository.create({
          id: event.id,
          slug: event.slug,
          name: event.name,
          city: event.city,
          venue: event.venue,
          startsAt: new Date(event.startsAt),
          teaser: event.teaser,
          description: event.description,
          highlights: event.highlights,
          initialInventory: event.remainingInventory,
        }),
      );

      await this.eventRepository.save(demoEntities);
    }

    const persistedEvents = await this.eventRepository.find();

    for (const event of persistedEvents) {
      await this.redisService.ensureTicketStock(event.id, event.initialInventory);
    }
  }
}
