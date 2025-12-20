import {
  ConflictException,
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
import { TelemetryAnalyticsService } from '@/modules/telemetry/services/telemetry-analytics.service';
import type { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly influxService: InfluxService,
    private readonly accessControl: AccessControlService,
    private readonly telemetryAnalytics: TelemetryAnalyticsService,
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

    if (createUnitDto.deviceId && createUnitDto.channelIndex !== undefined) {
      const existingMap = await this.prisma.channelMap.findFirst({
        where: {
          deviceId: createUnitDto.deviceId,
          channelIndex: createUnitDto.channelIndex,
        },
      });

      if (existingMap) {
        throw new ConflictException(
          `O canal ${createUnitDto.channelIndex} deste dispositivo já está em uso.`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const unit = await tx.unit.create({
        data: {
          name: createUnitDto.name,
          plantId: createUnitDto.plantId,
        },
      });

      if (createUnitDto.deviceId && createUnitDto.channelIndex !== undefined) {
        await tx.channelMap.create({
          data: {
            unitId: unit.id,
            deviceId: createUnitDto.deviceId,
            channelIndex: createUnitDto.channelIndex,
          },
        });
      }

      return unit;
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

    const enrichedUnits = await this.telemetryAnalytics.enrichUnits(units);

    return enrichedUnits as unknown as UnitResponseDto[];
  }

  async findOne(id: string, user: JwtPayload) {
    await this.accessControl.requireUnitAccess(user.sub, id, user.role);

    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        channelMaps: { include: { device: true } },
      },
    });

    if (!unit) throw new NotFoundException('Unidade não encontrada');

    const [enrichedUnit] = await this.telemetryAnalytics.enrichUnits([unit]);

    return enrichedUnit;
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

  async update(id: string, dto: UpdateUnitDto, user: JwtPayload) {
    await this.accessControl.requireUnitAccess(user.sub, id, user.role);

    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: { channelMaps: true },
    });

    if (!unit) throw new NotFoundException('Unidade não encontrada');

    if (dto.deviceId && dto.channelIndex !== undefined) {
      const existingMap = await this.prisma.channelMap.findFirst({
        where: {
          deviceId: dto.deviceId,
          channelIndex: dto.channelIndex,
          NOT: { unitId: id },
        },
      });

      if (existingMap) {
        throw new ConflictException(
          `O canal ${dto.channelIndex} deste dispositivo já está em uso por outra unidade.`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUnit = await tx.unit.update({
        where: { id },
        data: {
          name: dto.name,
        },
      });

      if (dto.deviceId && dto.channelIndex !== undefined) {
        await tx.channelMap.deleteMany({
          where: { unitId: id },
        });

        await tx.channelMap.create({
          data: {
            unitId: id,
            deviceId: dto.deviceId,
            channelIndex: dto.channelIndex,
          },
        });
      }

      return updatedUnit;
    });
  }
}
