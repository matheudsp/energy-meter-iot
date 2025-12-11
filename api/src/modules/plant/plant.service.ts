import { Injectable, NotFoundException } from '@nestjs/common';

import { CreatePlantDto } from './dto/create-plant.dto';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { AccessControlService } from '@/providers/access-control/access-control.service';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@Injectable()
export class PlantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  // async create(dto: CreatePlantDto) {
  //   const plant = this.plantRepository.create({
  //     name: dto.name,
  //     address: dto.address,
  //   });

  //   return this.plantRepository.save(plant);
  // }

  async findAll(user: JwtPayload) {
    const filter = this.accessControl.getPlantAccessFilter(user.sub, user.role); //

    return this.prisma.plant.findMany({
      where: filter,
      include: {
        owner: true,
        devices: true,
        units: true,
      },
    });
  }

  async findOne(id: string, user: JwtPayload) {
    await this.accessControl.requirePlantAccess(user.sub, id, user.role);

    const plant = await this.prisma.plant.findUnique({
      where: { id },
      include: {
        owner: true,
        devices: true,
        units: true,
      },
    });

    if (!plant) throw new NotFoundException('Planta não encontrada');
    return plant;
  }
}
