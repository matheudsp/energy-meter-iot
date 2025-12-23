import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { TelemetryAnalyticsService } from '../telemetry/services/telemetry-analytics.service';
import { AccessControlService } from '@/providers/access-control/access-control.service';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import {
  type Unit,
  type ChannelMap,
  type Device,
  DeviceStatus,
} from 'generated/prisma/client';

// Tipagem auxiliar para representar a Unidade com as relações necessárias
type UnitWithRelations = Unit & {
  plantName: string;
  channelMaps: (ChannelMap & {
    device: Device;
  })[];
};

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

    const allUnits: UnitWithRelations[] = plants.flatMap((p) =>
      p.units.map((u) => ({ ...u, plantName: p.name })),
    );

    return this.processUnitsToDashboard(allUnits, plants.length);
  }

  async getTenantOverview(user: JwtPayload): Promise<DashboardOverviewDto> {
    const now = new Date();

    const units = await this.prisma.unit.findMany({
      where: {
        tenancies: {
          some: {
            tenantId: user.sub,
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        },
      },
      include: {
        plant: true,
        channelMaps: {
          include: {
            device: true,
          },
        },
      },
    });

    const uniquePlantIds = new Set(units.map((u) => u.plantId));

    const mappedUnits: UnitWithRelations[] = units.map((u) => ({
      ...u,
      plantName: u.plant.name,
    }));

    return this.processUnitsToDashboard(mappedUnits, uniquePlantIds.size);
  }

  private async processUnitsToDashboard(
    rawUnits: UnitWithRelations[],
    activePlantsCount: number,
  ): Promise<DashboardOverviewDto> {
    const enrichedUnits = await this.telemetryAnalytics.enrichUnits(rawUnits);

    let totalPower = 0;
    let totalEnergyMonth = 0;
    let onlineDevicesCount = 0;

    const uniqueDeviceIds = new Set<string>();
    const onlineDeviceIds = new Set<string>();

    enrichedUnits.forEach((unit) => {
      totalPower += unit.telemetry?.power || 0;
      totalEnergyMonth += unit.telemetry?.monthlyKwh || 0;

      if (unit.channelMaps) {
        unit.channelMaps.forEach((map) => {
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
      .sort((a, b) => {
        const consumptionA = a.telemetry?.monthlyKwh || 0;
        const consumptionB = b.telemetry?.monthlyKwh || 0;
        return consumptionB - consumptionA;
      })
      .slice(0, 5)
      .map((u) => ({
        unitId: u.id,
        unitName: u.name,
        plantName: u.plantName,
        consumption: u.telemetry?.monthlyKwh || 0,
        power: u.telemetry?.power || 0,
      }));

    // TODO: Para ter o trend real, é necessário buscar o consumo do mês anterior no InfluxDB/TelemetryService.
    const previousMonthTotal = 0;

    const trend =
      previousMonthTotal > 0
        ? ((totalEnergyMonth - previousMonthTotal) / previousMonthTotal) * 100
        : 0;

    return {
      kpis: {
        totalPower,
        totalEnergyMonth,
        energyTrend: parseFloat(trend.toFixed(1)),
        activePlants: activePlantsCount,
        totalUnits: enrichedUnits.length,
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
