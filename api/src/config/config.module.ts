import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [],
  exports: [ConfigModule],
})
export class AppConfigModule {}
