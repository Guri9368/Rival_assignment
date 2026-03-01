import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';

async function bootstrap() {
  // Create app with Pino as the logger from the very first line
  // bufferLogs: true holds early logs until Pino is fully initialized
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Replace NestJS default logger with Pino — all Logger() calls now go through Pino
  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api/v1');

  // Specific filter before generic — 429 handled before 500
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new ThrottlerExceptionFilter(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  // Use Pino logger for startup message too
  const logger = app.get(Logger);
  logger.log(`🚀 Backend running on http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap();
