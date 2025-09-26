import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, STATES } from 'mongoose';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DatabaseService.name);
  }

  onModuleInit() {
    this.logger.info('🔹 DatabaseService initialized');

    this.connection.on('connected', () => {
      this.logger.info('✅ MongoDB connected');
    });

    this.connection.on('error', (err: Error) => {
      this.logger.error({ err }, '❌ MongoDB error');
    });

    if (this.connection.readyState === STATES.connected) {
      this.logger.info('✅ MongoDB already connected');
    }
  }
}
