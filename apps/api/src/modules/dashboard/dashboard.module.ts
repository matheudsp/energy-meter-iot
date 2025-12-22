import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { AccessControlModule } from '@/providers/access-control/access-control.module';

@Module({
  imports: [TelemetryModule, AccessControlModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
