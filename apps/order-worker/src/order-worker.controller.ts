import { Controller, Get } from '@nestjs/common';
import { OrderWorkerService } from './order-worker.service';

@Controller()
export class OrderWorkerController {
  constructor(private readonly orderWorkerService: OrderWorkerService) {}

  @Get()
  getHello(): string {
    return this.orderWorkerService.getHello();
  }
}
