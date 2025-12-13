import { Controller } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  MqttContext,
} from '@nestjs/microservices';
import { TelemetryService } from './telemetry.service';
import { EnergyMeterPayload } from './interfaces/telemetry.interface';
import { Public } from '@/common/decorators/is-public.decorator';

@Controller()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}
  @Public()
  @MessagePattern('energymeter/+/data')
  async handleEnergyData(
    @Payload() data: EnergyMeterPayload,
    @Ctx() context: MqttContext,
  ) {
    await this.telemetryService.processTelemetry(data);
  }
}
