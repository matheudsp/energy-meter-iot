import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { InfluxService } from '@/providers/database/influx/influx.service';
import { EnergyMeterPayload } from './interfaces/telemetry.interface';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly influxService: InfluxService,
    private readonly prisma: PrismaService,
  ) {}

  async processTelemetry(payload: EnergyMeterPayload) {
    const { device_id, channels } = payload;

    if (!channels || !device_id) {
      this.logger.warn(
        'Payload inválido recebido: Faltando device_id ou channels',
      );
      return;
    }

    try {
      await this.prisma.device.update({
        where: { serialNumber: device_id },
        data: { lastSeenAt: new Date() },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.warn(
          `Dispositivo ${device_id} enviando dados mas não cadastrado no banco.`,
        );
      } else {
        this.logger.error(
          `Erro ao atualizar lastSeen para ${device_id}: ${error.message}`,
        );
      }
    }

    for (const [channelId, data] of Object.entries(channels)) {
      if (data.voltage === 0 && data.total_kwh === 0) continue;

      await this.influxService.writeMeasurement(device_id, channelId, {
        voltage: data.voltage,
        current: data.current,
        power: data.power,
        total_kwh: data.total_kwh,
      });
    }

    this.logger.log(
      `Dados processados para ${device_id} (${Object.keys(channels).length} canais)`,
    );
  }
}
