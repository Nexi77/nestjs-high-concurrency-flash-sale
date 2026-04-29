import { GetOrderStatusResponse } from '@lib/common';
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':orderId/status')
  async getOrderStatus(
    @Param('orderId', new ParseUUIDPipe()) orderId: string,
  ): Promise<GetOrderStatusResponse> {
    return this.ordersService.getOrderStatus(orderId);
  }
}
