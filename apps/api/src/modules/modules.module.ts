import { Module } from '@nestjs/common';
import { UnitModule } from '@/modules/unit/unit.module';
import { DeviceModule } from '@/modules/device/device.module';
import { ChannelMapModule } from '@/modules/channel-map/channel-map.module';
import { PlantModule } from './plant/plant.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { UsersModule } from './user/user.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    UnitModule,
    DeviceModule,
    ChannelMapModule,
    PlantModule,
    TelemetryModule,
    TenancyModule,
    DashboardModule,
  ],
  providers: [],
})
export class ModulesModule {}
