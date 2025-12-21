import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';
import { DeviceStatus } from 'generated/prisma/enums';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { AccessControlService } from '@/providers/access-control/access-control.service';
import type { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DeviceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    return this.prisma.device.create({
      data: {
        serialNumber: createDeviceDto.serialNumber,
        status: DeviceStatus.OFFLINE,
      },
    });
  }

  async associateToPlant(
    serialNumber: string,
    plantId: string,
    user: JwtPayload,
  ) {
    await this.accessControl.requirePlantAccess(user.sub, plantId, user.role);

    const device = await this.prisma.device.findUnique({
      where: { serialNumber },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    if (device.plantId && device.plantId !== plantId) {
      throw new ConflictException(
        'Este dispositivo já está associado a outra planta.',
      );
    }

    if (device.plantId === plantId) {
      return device;
    }

    return this.prisma.device.update({
      where: { id: device.id },
      data: {
        plantId: plantId,
      },
    });
  }

  async dissociateFromPlant(deviceId: string, user: JwtPayload) {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    if (!device.plantId) {
      throw new ConflictException(
        'O dispositivo não está associado a nenhuma planta.',
      );
    }

    await this.accessControl.requirePlantAccess(
      user.sub,
      device.plantId,
      user.role,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.channelMap.deleteMany({
        where: { deviceId: device.id },
      });

      return tx.device.update({
        where: { id: deviceId },
        data: {
          plantId: null,
        },
      });
    });
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    const device = await this.prisma.device.findUnique({ where: { id } });

    if (!device) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    return this.prisma.device.update({
      where: { id },
      data: updateDeviceDto,
    });
  }

  async findAll() {
    return this.prisma.device.findMany();
  }

  async findOne(id: string) {
    return this.prisma.device.findUnique({ where: { id } });
  }

  async provisionDevice(serialNumber: string, csrPem: string) {
    const device = await this.prisma.device.findUnique({
      where: { serialNumber },
    });

    if (!device) {
      throw new NotFoundException(
        `Dispositivo ${serialNumber} não cadastrado ou não autorizado.`,
      );
    }

    try {
      const caCertPem = fs.readFileSync(
        path.join(process.cwd(), 'certs', 'ca.crt'),
        'utf8',
      );
      const caKeyPem = fs.readFileSync(
        path.join(process.cwd(), 'certs', 'ca.key'),
        'utf8',
      );

      const caCert = forge.pki.certificateFromPem(caCertPem);
      const caKey = forge.pki.privateKeyFromPem(caKeyPem);

      const csr = forge.pki.certificationRequestFromPem(csrPem);

      if (!csr.verify()) {
        throw new Error('Assinatura do CSR inválida.');
      }

      if (!csr.publicKey) {
        throw new Error('O CSR fornecido não contém uma chave pública válida.');
      }

      const cert = forge.pki.createCertificate();
      cert.serialNumber = device.id.replace(/-/g, '');

      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(
        cert.validity.notBefore.getFullYear() + 1,
      );

      cert.setSubject([
        { name: 'commonName', value: device.serialNumber },
        { name: 'organizationName', value: 'EnergyMeter IOT' },
      ]);

      cert.setIssuer(caCert.subject.attributes);
      cert.publicKey = csr.publicKey;
      cert.sign(caKey, forge.md.sha256.create());

      return {
        certificate: forge.pki.certificateToPem(cert),
        caCertificate: caCertPem,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Falha ao assinar certificado: ' + error.message,
      );
    }
  }
}
