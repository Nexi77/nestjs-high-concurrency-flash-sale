import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [OrderEntity],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([OrderEntity]),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
