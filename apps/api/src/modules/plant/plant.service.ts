import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreatePlantDto } from './dto/create-plant.dto';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { AccessControlService } from '@/providers/access-control/access-control.service';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { InfluxService } from '@/providers/database/influx/influx.service';
import { TelemetryAnalyticsService } from '../telemetry/services/telemetry-analytics.service';

@Injectable()
export class PlantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly influxService: InfluxService,
    private readonly telemetryAnalytics: TelemetryAnalyticsService,
  ) {}

  // async create(dto: CreatePlantDto) {
  //   const plant = this.plantRepository.create({
  //     name: dto.name,
  //     address: dto.address,
  //   });

  //   return this.plantRepository.save(plant);
  // }

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

  async addDevice(plantId: string, serialNumber: string, user: JwtPayload) {
    await this.accessControl.requirePlantAccess(user.sub, plantId, user.role);
    const device = await this.prisma.device.findUnique({
      where: { serialNumber },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    if (device.plantId && device.plantId !== plantId) {
      throw new BadRequestException(
        'Este dispositivo já está associado a outra planta. Remova-o da planta anterior antes de adicionar aqui.',
      );
    }

    if (device.plantId === plantId) {
      return device;
    }

    // 5. Realiza a associação
    return this.prisma.device.update({
      where: { id: device.id },
      data: { plantId },
    });
  }
}
