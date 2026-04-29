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
import { OrderStatusService } from '@redis/redis';

@Processor('order-queue')
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectQueue('notification-queue')
    private readonly notificationQueue: Queue<OrderNotificationJobData>,
    private readonly orderStatusService: OrderStatusService,
  ) {
    super();
  }

  async process(job: Job<OrderJobData, any, string>) {
    this.logger.log(`Processing order for job ${job.id}...`);

    const { orderId, ticketId, customerEmail } = job.data;

    const existingOrder = await this.orderRepository.findOne({
      where: { ticketId, customerEmail },
    });

    if (existingOrder) {
      this.logger.warn(
        `Order for ${customerEmail} and ticket ${ticketId} already exists. Skipping.`,
      );
      return { orderId: existingOrder.id, status: 'already_exists' };
    }

    const newOrder = this.orderRepository.create({
      id: orderId,
      ticketId,
      customerEmail,
      status: 'confirmed',
    });

    try {
      await this.orderRepository.manager.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager.save(newOrder);
        },
        // closed in a transacftion for future use, like substracting money from user account, etc.
      );
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const persistedOrder = await this.orderRepository.findOne({
          where: { ticketId, customerEmail },
        });

        if (persistedOrder) {
          await this.orderStatusService.clearPending(persistedOrder.id);
          this.logger.warn(
            `Duplicate order write detected for ${customerEmail} and ticket ${ticketId}. Returning persisted order.`,
          );
          return {
            orderId: persistedOrder.id,
            status: 'already_exists',
          };
        }
      }

      throw error;
    }

    await this.orderStatusService.clearPending(newOrder.id);

    await this.notificationQueue.add('send_notification', {
      ticketId,
      customerEmail,
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

  private isUniqueViolation(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
