import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // bufferLogs: true,
  });

  // app.useLogger(app.get(Logger));
  // main.ts

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // удаляет лишние поля
      forbidNonWhitelisted: true, // выброс ошибки при лишних полях
      transform: true, // автоматически превращает JSON в DTO
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
