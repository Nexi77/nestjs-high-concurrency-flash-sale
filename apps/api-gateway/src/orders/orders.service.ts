import { OrderEntity } from '@db/database';
import { GetOrderStatusResponse } from '@lib/common';
import { OrderStatusService } from '@redis/redis';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly orderStatusService: OrderStatusService,
  ) {}

  async getOrderStatus(orderId: string): Promise<GetOrderStatusResponse> {
    const persistedOrder = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (persistedOrder) {
      return {
        orderId: persistedOrder.id,
        status: 'completed',
      };
    }

    const isPending = await this.orderStatusService.isPending(orderId);

    if (isPending) {
      return {
        orderId,
        status: 'pending',
      };
    }

    throw new NotFoundException(`Order ${orderId} was not found`);
  }
}
