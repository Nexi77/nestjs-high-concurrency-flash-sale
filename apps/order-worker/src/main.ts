import { NestFactory } from '@nestjs/core';
import { OrderWorkerModule } from './order-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(OrderWorkerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
