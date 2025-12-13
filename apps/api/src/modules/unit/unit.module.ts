import { Module } from '@nestjs/common';
import { UnitService } from './unit.service';
import { UnitController } from './unit.controller';
import { TelemetryAnalyticsService } from '../telemetry/services/telemetry-analytics.service';

@Module({
  controllers: [UnitController],
  providers: [UnitService, TelemetryAnalyticsService],
  exports: [UnitService],
})
export class UnitModule {}
