import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // bufferLogs: true,
  });

  // app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
