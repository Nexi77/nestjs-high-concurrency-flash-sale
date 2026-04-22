import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { OrderJobData, OrderNotificationJobData } from '@lib/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from '@db/database';
import { Repository } from 'typeorm';

@Processor('order-queue')
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectQueue('notification-queue')
    private readonly notificationQueue: Queue<OrderNotificationJobData>,
  ) {
    super();
  }

  async process(job: Job<OrderJobData, any, string>) {
    this.logger.log(`Processing order for job ${job.id}...`);

    const { ticketId, userId } = job.data;

    const newOrder = this.orderRepository.create({
      ticketId,
      userId,
      status: 'confirmed',
    });

    await this.orderRepository.save(newOrder);

    await this.notificationQueue.add('send_notification', {
      ticketId,
      userId,
      orderId: newOrder.id,
      timestamp: newOrder.createdAt.toISOString(),
    });

    return { orderId: newOrder.id };
  }
}
