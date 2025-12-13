import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryAnalyticsService } from './services/telemetry-analytics.service';

@Module({
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryAnalyticsService],
  exports: [TelemetryService, TelemetryAnalyticsService],
})
export class TelemetryModule {}
