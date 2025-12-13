import { Module, Global } from '@nestjs/common';
import { InfluxService } from './influx.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [InfluxService],
  exports: [InfluxService],
})
export class InfluxModule {}
