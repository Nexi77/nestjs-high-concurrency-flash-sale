import { Test, TestingModule } from '@nestjs/testing';
import { OrderWorkerController } from './order-worker.controller';
import { OrderWorkerService } from './order-worker.service';

describe('OrderWorkerController', () => {
  let orderWorkerController: OrderWorkerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrderWorkerController],
      providers: [OrderWorkerService],
    }).compile();

    orderWorkerController = app.get<OrderWorkerController>(OrderWorkerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(orderWorkerController.getHello()).toBe('Hello World!');
    });
  });
});
