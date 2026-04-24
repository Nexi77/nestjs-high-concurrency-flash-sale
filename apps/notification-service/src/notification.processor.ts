import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { OrderNotificationJobData } from '@lib/common';

@Processor('notification-queue')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger('NotificationService');

  async process(job: Job<OrderNotificationJobData>) {
    const { customerEmail, ticketId, orderId, timestamp } = job.data;
    const normalizedTimestamp = new Date(timestamp).toISOString();

    await new Promise((resolve) => setTimeout(resolve, 500));

    this.logger.log(`
      ╔════════════════ NEW NOTIFICATION ════════════════╗
      ║ To: ${customerEmail}
      ║ Subject: Order Confirmation #${orderId.split('-')[0]}
      ║ ------------------------------------------------
      ║ Your ticket for event ${ticketId} 
      ║ has been successfully booked!
      ║ 
      ║ Time: ${normalizedTimestamp}
      ╚══════════════════════════════════════════════════╝
    `);
  }
}
