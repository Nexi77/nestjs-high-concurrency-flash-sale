import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  const configService = app.get<ConfigService>(ConfigService);
  await app.listen(configService.get('NOTIFICATION_SERVICE_PORT') ?? 3000);
}
void bootstrap();
