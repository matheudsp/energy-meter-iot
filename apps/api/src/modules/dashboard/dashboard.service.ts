import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { TelemetryAnalyticsService } from '../telemetry/services/telemetry-analytics.service';
import { AccessControlService } from '@/providers/access-control/access-control.service';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { DeviceStatus } from '@/common/enums/domain.enums';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telemetryAnalytics: TelemetryAnalyticsService,
    private readonly accessControl: AccessControlService,
  ) {}

  async getOverview(user: JwtPayload): Promise<DashboardOverviewDto> {
    const plantFilter = this.accessControl.getPlantAccessFilter(
      user.sub,
      user.role,
    );
    const unitFilter = this.accessControl.getUnitAccessFilter(
      user.sub,
      user.role,
    );

    const plants = await this.prisma.plant.findMany({
      where: plantFilter,
      include: {
        units: {
          where: unitFilter,
          include: {
            channelMaps: {
              include: {
                device: true,
              },
            },
          },
        },
      },
    });

    const allUnits = plants.flatMap((p) =>
      p.units.map((u) => ({ ...u, plantName: p.name })),
    );

    const enrichedUnits = await this.telemetryAnalytics.enrichUnits(allUnits);

    let totalPower = 0;
    let totalEnergyMonth = 0;
    let onlineDevicesCount = 0;

    // Set para contar dispositivos únicos (evitar duplicar se usar 2 canais do mesmo device)
    const uniqueDeviceIds = new Set<string>();
    const onlineDeviceIds = new Set<string>();

    enrichedUnits.forEach((unit: any) => {
      totalPower += unit.telemetry?.power || 0;
      totalEnergyMonth += unit.telemetry?.monthlyKwh || 0;

      if (unit.channelMaps) {
        unit.channelMaps.forEach((map: any) => {
          if (map.device) {
            uniqueDeviceIds.add(map.device.id);
            if (map.device.status === DeviceStatus.ONLINE) {
              onlineDeviceIds.add(map.device.id);
            }
          }
        });
      }
    });

    const totalDevices = uniqueDeviceIds.size;
    onlineDevicesCount = onlineDeviceIds.size;

    const topConsumers = enrichedUnits
      .sort(
        (a: any, b: any) =>
          (b.telemetry?.monthlyKwh || 0) - (a.telemetry?.monthlyKwh || 0),
      )
      .slice(0, 5)
      .map((u: any) => ({
        unitId: u.id,
        unitName: u.name,
        plantName: u.plantName,
        consumption: u.telemetry?.monthlyKwh || 0,
        power: u.telemetry?.power || 0,
      }));

    const previousMonthFake = totalEnergyMonth * 0.95;
    const trend =
      previousMonthFake > 0
        ? ((totalEnergyMonth - previousMonthFake) / previousMonthFake) * 100
        : 0;

    return {
      kpis: {
        totalPower,
        totalEnergyMonth,
        energyTrend: parseFloat(trend.toFixed(1)),
        activePlants: plants.length,
        totalUnits: allUnits.length,
        deviceStatus: {
          total: totalDevices,
          online: onlineDevicesCount,
          offline: totalDevices - onlineDevicesCount,
        },
      },
      topConsumers,
      consumptionHistory: [],
    };
  }
}
