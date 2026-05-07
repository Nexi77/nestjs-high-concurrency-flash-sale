import { EventDetails, EventSummary } from '@lib/common';
import { EventEntity } from '@db/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '@redis/redis';
import { Repository } from 'typeorm';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    private readonly redisService: RedisService,
  ) {}

  async listEvents(): Promise<EventSummary[]> {
    const events = await this.eventRepository.find({
      order: { startsAt: 'ASC' },
    });

    return Promise.all(events.map((event) => this.toSummary(event)));
  }

  async getEvent(eventId: string): Promise<EventDetails> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event ${eventId} was not found`);
    }

    return this.toDetails(event);
  }

  private async toSummary(event: EventEntity): Promise<EventSummary> {
    return {
      id: event.id,
      slug: event.slug,
      name: event.name,
      city: event.city,
      venue: event.venue,
      startsAt: event.startsAt.toISOString(),
      teaser: event.teaser,
      remainingInventory: await this.getRemainingInventory(event),
    };
  }

  private async toDetails(event: EventEntity): Promise<EventDetails> {
    return {
      ...(await this.toSummary(event)),
      description: event.description,
      highlights: event.highlights,
    };
  }

  private async getRemainingInventory(event: EventEntity): Promise<number> {
    const stock = await this.redisService.getTicketStock(event.id);
    return stock ?? event.initialInventory;
  }
}
