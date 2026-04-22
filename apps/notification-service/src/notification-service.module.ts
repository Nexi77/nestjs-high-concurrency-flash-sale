import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsProcessor } from './notification.processor';

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
      name: 'notification-queue',
    }),
  ],
  controllers: [],
  providers: [NotificationsProcessor],
})
export class NotificationServiceModule {}
