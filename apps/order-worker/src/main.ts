import { NestFactory } from '@nestjs/core';
import { OrderWorkerModule } from './order-worker.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(OrderWorkerModule);
  const configService = app.get<ConfigService>(ConfigService);
  await app.listen(configService.get('ORDER_WORKER_PORT') ?? 3000);
}
void bootstrap();
