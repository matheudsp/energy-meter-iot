import { Injectable } from '@nestjs/common';
import { InfluxService } from '@/providers/database/influx/influx.service';
import {
  UnitWithDeviceRelations,
  UnitTelemetry,
  ChannelTelemetry,
} from '@/common/interfaces/telemetry.types';

@Injectable()
export class TelemetryAnalyticsService {
  constructor(private readonly influxService: InfluxService) {}

  /**
   * Enriquece uma lista de unidades com dados de telemetria.
   */
  async enrichUnits<T extends UnitWithDeviceRelations>(
    units: T[],
  ): Promise<Array<T & { telemetry: UnitTelemetry }>> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return Promise.all(
      units.map(async (unit) => {
        const telemetry = await this.calculateUnitTelemetry(unit, startOfMonth);

        const { channelMaps, ...unitData } = unit;

        return {
          ...unitData,

          channelMaps,
          telemetry,
        } as T & { telemetry: UnitTelemetry };
      }),
    );
  }

  private async calculateUnitTelemetry(
    unit: UnitWithDeviceRelations,
    periodStart: Date,
  ): Promise<UnitTelemetry> {
    let totalPower = 0;
    let totalKwh = 0;
    let monthlyKwh = 0;
    let maxLastSeen: Date | null = null;
    const channelsData: ChannelTelemetry[] = [];

    if (unit.channelMaps) {
      for (const map of unit.channelMaps) {
        if (map.deletedAt) continue;

        if (map.device.lastSeenAt) {
          const deviceDate = new Date(map.device.lastSeenAt);
          if (!maxLastSeen || deviceDate > maxLastSeen) {
            maxLastSeen = deviceDate;
          }
        }

        const serial = map.device.serialNumber;
        const channelStr = map.channelIndex.toString();

        const [lastData, consumption] = await Promise.all([
          this.influxService.getLastState(serial, channelStr),
          this.influxService.getConsumptionDifference(
            serial,
            channelStr,
            periodStart,
          ),
        ]);

        if (lastData) {
          totalPower += lastData.power;
          totalKwh += lastData.total_kwh;
          monthlyKwh += consumption;

          channelsData.push({
            channel: map.channelIndex,
            voltage: lastData.voltage,
            current: lastData.current,
            power: lastData.power,
            monthlyKwh: consumption,
          });
        }
      }
    }

    const isOnline = maxLastSeen
      ? new Date().getTime() - maxLastSeen.getTime() < 5 * 60 * 1000
      : false;

    return {
      power: Number(totalPower.toFixed(2)),
      totalKwh: Number(totalKwh.toFixed(3)),
      monthlyKwh: Number(monthlyKwh.toFixed(3)),
      lastUpdate: maxLastSeen,
      isOnline,
      channels: channelsData,
    };
  }
}
