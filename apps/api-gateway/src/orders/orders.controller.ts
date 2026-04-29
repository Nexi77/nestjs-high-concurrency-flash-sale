import { GetOrderStatusResponse } from '@lib/common';
import {
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { OrderEventsService } from './order-events.service';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderEventsService: OrderEventsService,
  ) {}

  @Get(':orderId/status')
  async getOrderStatus(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
  ): Promise<GetOrderStatusResponse> {
    return this.ordersService.getOrderStatus(orderId);
  }

  @Sse(':orderId/events')
  streamOrderStatus(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
  ): Observable<MessageEvent> {
    return this.orderEventsService.streamOrderStatus(orderId);
  }
}
