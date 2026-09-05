import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configuredOrigins =
    process.env.CORS_ORIGINS
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  app.enableCors({
    origin:
      configuredOrigins.length > 0
        ? configuredOrigins
        : process.env.NODE_ENV === 'production'
          ? false
          : true,
    credentials: true,
  });

  app.enableShutdownHooks();

  app.use((request: any, response: any, next: () => void) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
