import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USER', 'voltis'),
        password: configService.get<string>('DB_PASSWORD', 'voltis_dev_password'),
        database: configService.get<string>('DB_NAME', 'voltis'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [
          'apps/api/dist/database/migrations/*.js',
          'apps/api/src/database/migrations/*.ts',
          'dist/database/migrations/*.js',
          'src/database/migrations/*.ts',
        ],
        migrationsRun:
          configService.get<string>('DB_MIGRATIONS_RUN', 'false') === 'true',
        logging: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}