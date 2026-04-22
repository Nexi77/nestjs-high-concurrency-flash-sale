import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const configService = app.get<ConfigService>(ConfigService);
  await app.listen(configService.get('API_GATEWAY_PORT', 3000));
}
void bootstrap();
