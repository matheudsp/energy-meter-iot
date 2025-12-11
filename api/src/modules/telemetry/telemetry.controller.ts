import { Controller } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  MqttContext,
} from '@nestjs/microservices';
import { TelemetryService } from './telemetry.service';
import { EnergyMeterPayload } from './interfaces/telemetry.interface';

@Controller()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @MessagePattern('energymeter/+/data')
  async handleEnergyData(
    @Payload() data: EnergyMeterPayload,
    @Ctx() context: MqttContext,
  ) {
    await this.telemetryService.processTelemetry(data);
  }
}
