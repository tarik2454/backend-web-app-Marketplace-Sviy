import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import config from './config/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: '.env',
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      },
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('DB_HOST');
        return { uri };
      },
    }),

    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    ChatModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
