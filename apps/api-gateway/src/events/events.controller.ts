import { EventDetails, EventSummary } from '@lib/common';
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async listEvents(): Promise<EventSummary[]> {
    return this.eventsService.listEvents();
  }

  @Get(':eventId')
  async getEvent(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
  ): Promise<EventDetails> {
    return this.eventsService.getEvent(eventId);
  }
}
