import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { AccessControlService } from '@/providers/access-control/access-control.service';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

import { TelemetryAnalyticsService } from '../telemetry/services/telemetry-analytics.service';
import type { UpdatePlantDto } from './dto/update-plant.dto';
import type { CreatePlantDto } from './dto/create-plant.dto';

@Injectable()
export class PlantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly telemetryAnalytics: TelemetryAnalyticsService,
  ) {}

  async create(dto: CreatePlantDto, user: JwtPayload) {
    return this.prisma.plant.create({
      data: {
        name: dto.name,
        address: dto.address,
        ownerId: user.sub,
      },
    });
  }

  async findAll(user: JwtPayload) {
    const plantFilter = this.accessControl.getPlantAccessFilter(
      user.sub,
      user.role,
    );

    const unitFilter = this.accessControl.getUnitAccessFilter(
      user.sub,
      user.role,
    );

    return this.prisma.plant.findMany({
      where: plantFilter,
      include: {
        owner: true,
        devices: true,
        units: {
          where: unitFilter,
        },
      },
    });
  }

  async findOne(id: string, user: JwtPayload) {
    await this.accessControl.requirePlantAccess(user.sub, id, user.role);
    const unitFilter = this.accessControl.getUnitAccessFilter(
      user.sub,
      user.role,
    );

    const plant = await this.prisma.plant.findUnique({
      where: { id },
      include: {
        owner: true,
        devices: true,
        units: {
          where: unitFilter,
          include: {
            channelMaps: {
              include: { device: true },
            },
          },
        },
      },
    });
    if (!plant) throw new NotFoundException('Planta não encontrada');
    const enrichedUnits = await this.telemetryAnalytics.enrichUnits(
      plant.units,
    );

    return { ...plant, units: enrichedUnits };
  }

  async update(id: string, dto: UpdatePlantDto, user: JwtPayload) {
    await this.accessControl.requirePlantAccess(user.sub, id, user.role);

    return this.prisma.plant.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  /**
   * Exclui (Soft Delete) uma planta
   */
  async remove(id: string, user: JwtPayload) {
    await this.accessControl.requirePlantAccess(user.sub, id, user.role);

    return this.prisma.plant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
