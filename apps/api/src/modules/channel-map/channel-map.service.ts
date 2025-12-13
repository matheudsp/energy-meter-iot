import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { CreateChannelMapDto } from './dto/create-channel-map.dto';

@Injectable()
export class ChannelMapService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChannelMapDto) {
    const device = await this.prisma.device.findUnique({
      where: { id: dto.deviceId },
    });
    if (!device) throw new NotFoundException('Dispositivo não encontrado.');

    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
    });
    if (!unit) throw new NotFoundException('Unidade não encontrada.');

    const existingMap = await this.prisma.channelMap.findFirst({
      where: {
        deviceId: dto.deviceId,
        channelIndex: dto.channelNumber,
      },
    });

    if (existingMap) {
      throw new ConflictException(
        `O canal ${dto.channelNumber} do dispositivo já está em uso pela unidade ${existingMap.unitId}.`,
      );
    }

    return this.prisma.channelMap.create({
      data: {
        deviceId: dto.deviceId,
        unitId: dto.unitId,
        channelIndex: dto.channelNumber,
      },
    });
  }

  async findAll() {
    return this.prisma.channelMap.findMany({
      include: {
        device: true,
        unit: true,
      },
    });
  }

  async delete(id: string) {
    try {
      return await this.prisma.channelMap.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Mapeamento não encontrado.');
      }
      throw new error();
    }
  }

  async removeByDevice(deviceId: string) {
    return this.prisma.channelMap.deleteMany({
      where: { deviceId },
    });
  }
}
