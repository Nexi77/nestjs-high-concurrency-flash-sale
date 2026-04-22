import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(configService.get('API_GATEWAY_PORT', 3000));
}
void bootstrap();
