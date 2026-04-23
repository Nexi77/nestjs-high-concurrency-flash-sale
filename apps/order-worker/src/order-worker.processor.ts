import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
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

    const existingOrder = await this.orderRepository.findOne({
      where: { ticketId, userId },
    });

    if (existingOrder) {
      this.logger.warn(
        `Order for user ${userId} and ticket ${ticketId} already exists. Skipping.`,
      );
      return { orderId: existingOrder.id, status: 'already_exists' };
    }

    const newOrder = this.orderRepository.create({
      ticketId,
      userId,
      status: 'confirmed',
    });

    await this.orderRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.save(newOrder);
      },
      // closed in a transacftion for future use, like substracting money from user account, etc.
    );

    await this.notificationQueue.add('send_notification', {
      ticketId,
      userId,
      orderId: newOrder.id,
      timestamp: newOrder.createdAt.toISOString(),
    });

    return { orderId: newOrder.id };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<OrderJobData, any, string>, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts. Error: ${error.message}`,
    );

    // here we can use webhook to send notification on slack for example to service admin about failed job after all retry attempts are exhausted
  }
}
