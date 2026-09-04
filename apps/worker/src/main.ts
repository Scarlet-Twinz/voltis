import 'reflect-metadata';
import {
  NestFactory,
} from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  await NestFactory.createApplicationContext(
    AppModule,
  );

  console.log(
    'VOLTIS payment worker is running',
  );
}

bootstrap();
