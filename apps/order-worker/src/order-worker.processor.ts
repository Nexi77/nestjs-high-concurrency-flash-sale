import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { OrderJobData } from '@lib/common';

@Processor('order-queue')
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);

  async process(job: Job<OrderJobData, any, string>) {
    this.logger.log(`Processing order for job ${job.id}...`);

    const { ticketId, userId } = job.data;

    // TODO: PostgreSQL save logic will go in here
    this.logger.debug(`[ORDER CREATED] Ticket: ${ticketId}, User: ${userId}`);

    // Simulation of processing time, e.g., generating email confirmation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.log(`Order ${job.id} processed successfully!`);

    return { success: true };
  }
}
