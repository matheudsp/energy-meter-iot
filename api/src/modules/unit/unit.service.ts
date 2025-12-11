import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { InfluxService } from '@/providers/database/influx/influx.service';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { UserRole } from '@/common/enums/domain.enums';
import { AccessControlService } from '@/providers/access-control/access-control.service';

@Injectable()
export class UnitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly influxService: InfluxService,
    private readonly accessControl: AccessControlService,
  ) {}

  async create(createUnitDto: CreateUnitDto, user: JwtPayload) {
    if (user.role === UserRole.OWNER) {
      const plant = await this.prisma.plant.findUnique({
        where: { id: createUnitDto.plantId },
      });
      if (!plant || plant.ownerId !== user.sub) {
        throw new ForbiddenException(
          'Você não pode criar unidades nesta planta.',
        );
      }
    }

    const plantExists = await this.prisma.plant.findUnique({
      where: { id: createUnitDto.plantId },
    });

    if (!plantExists) {
      throw new NotFoundException('Planta não encontrada');
    }

    return this.prisma.unit.create({
      data: {
        name: createUnitDto.name,
        plantId: createUnitDto.plantId,
      },
    });
  }

  async findAll(user: JwtPayload): Promise<UnitResponseDto[]> {
    const filter = this.accessControl.getUnitAccessFilter(user.sub, user.role);
    const units = await this.prisma.unit.findMany({
      where: filter,
      include: {
        plant: {
          include: { owner: true },
        },
        channelMaps: {
          include: { device: true },
        },
      },
    });

    const enrichedUnits = await Promise.all(
      units.map(async (unit) => {
        let totalPower = 0;
        let totalKwh = 0;

        let maxLastSeen: Date | null = null;

        if (unit.channelMaps) {
          for (const map of unit.channelMaps) {
            if (map.device?.lastSeenAt) {
              const deviceDate = new Date(map.device.lastSeenAt);
              if (!maxLastSeen || deviceDate > maxLastSeen) {
                maxLastSeen = deviceDate;
              }
            }
          }
        }

        const isOnline = maxLastSeen
          ? new Date().getTime() - maxLastSeen.getTime() < 600000
          : false;

        const channelsData: any[] = [];

        if (unit.channelMaps) {
          for (const map of unit.channelMaps) {
            if (map.deletedAt) continue;

            const lastData: any = await this.influxService.getLastState(
              map.device.serialNumber,
              map.channelIndex.toString(),
            );

            if (lastData) {
              totalPower += lastData.power || 0;
              totalKwh += lastData.total_kwh || 0;

              channelsData.push({
                channel: map.channelIndex,
                voltage: lastData.voltage,
                current: lastData.current,
                power: lastData.power,
              });
            }
          }
        }

        const { channelMaps, ...unitData } = unit;

        return {
          ...unitData,
          telemetry: {
            power: parseFloat(totalPower.toFixed(2)),
            totalKwh: parseFloat(totalKwh.toFixed(3)),
            lastUpdate: maxLastSeen,
            channels: channelsData,
            isOnline: isOnline,
          },
        };
      }),
    );

    return enrichedUnits;
  }

  async findOne(id: string, user: JwtPayload) {
    await this.accessControl.requireUnitAccess(user.sub, id, user.role);
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unidade não encontrada');
    return unit;
  }

  async getHistory(
    unitId: string,
    user: JwtPayload,
    period: 'day' | 'week' | 'month' | 'year',
    metric: 'total_kwh' | 'voltage' | 'current' | 'power' | 'all',
  ) {
    await this.accessControl.requireUnitAccess(user.sub, unitId, user.role);

    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        channelMaps: { include: { device: true } },
      },
    });

    const map = unit?.channelMaps?.[0];

    if (!unit || !map) {
      return { message: 'Unidade sem medidor vinculado', data: [] };
    }

    let start = '-24h';
    let window = '10m';

    switch (period) {
      case 'week':
        start = '-7d';
        window = '1d';
        break;
      case 'month':
        start = '-30d';
        window = '1d';
        break;
      case 'year':
        start = '-365d';
        window = '1mo';
        break;
    }

    const metricsToFetch =
      metric === 'all'
        ? ['voltage', 'current', 'power', 'total_kwh']
        : [metric];

    const results: any[] = [];

    for (const m of metricsToFetch) {
      let aggFn = 'mean';
      let isCumulative = false;

      if (m === 'total_kwh') {
        aggFn = 'max';
        isCumulative = true;
      }

      const data = await this.influxService.getMetricByPeriod(
        map.device.serialNumber,
        map.channelIndex.toString(),
        m,
        start,
        window,
        aggFn,
        isCumulative,
      );

      results.push({
        channel: map.channelIndex,
        metric: m,
        data: data,
      });
    }

    return results;
  }
}
