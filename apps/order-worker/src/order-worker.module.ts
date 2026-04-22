import { Module } from '@nestjs/common';
import { OrderWorkerController } from './order-worker.controller';
import { OrderWorkerService } from './order-worker.service';

@Module({
  imports: [],
  controllers: [OrderWorkerController],
  providers: [OrderWorkerService],
})
export class OrderWorkerModule {}
