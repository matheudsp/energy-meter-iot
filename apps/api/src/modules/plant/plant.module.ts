import { Module } from '@nestjs/common';
import { PlantService } from './plant.service';
import { PlantController } from './plant.controller';
import { TelemetryAnalyticsService } from '../telemetry/services/telemetry-analytics.service';

@Module({
  controllers: [PlantController],
  providers: [PlantService, TelemetryAnalyticsService],
  exports: [PlantService],
})
export class PlantModule {}
