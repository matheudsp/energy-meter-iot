import { Module } from '@nestjs/common';
import { UnitModule } from '@/modules/unit/unit.module';
import { DeviceModule } from '@/modules/device/device.module';
import { ChannelMapModule } from '@/modules/channel-map/channel-map.module';
import { PlantModule } from './plant/plant.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { UsersModule } from './user/user.module';
import { TenancyModule } from './tenancy/tenancy.module';

@Module({
  imports: [
    UsersModule,
    UnitModule,
    DeviceModule,
    ChannelMapModule,
    PlantModule,
    TelemetryModule,
    TenancyModule,
  ],
  providers: [],
})
export class ModulesModule {}
