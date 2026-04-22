import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TicketsModule } from './tickets/tickets.module';
import { ApiGatewayController } from './api-gateway.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TicketsModule],
  controllers: [ApiGatewayController],
  providers: [],
})
export class ApiGatewayModule {}
