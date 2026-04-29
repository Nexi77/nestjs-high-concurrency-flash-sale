import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderProcessor } from './order-worker.processor';
import { DatabaseModule } from '@db/database';
import { RedisModule } from '@redis/redis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'order-queue',
    }),
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
    DatabaseModule,
    RedisModule,
  ],
  controllers: [],
  providers: [OrderProcessor],
})
export class OrderWorkerModule {}
