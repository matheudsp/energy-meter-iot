import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/providers/database/prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto) {
    const plant = await this.prisma.plant.findUnique({
      where: { id: createDeviceDto.plantId },
    });

    if (!plant) {
      throw new NotFoundException('Planta não encontrada.');
    }

    return this.prisma.device.create({
      data: {
        serialNumber: createDeviceDto.serialNumber,
        status: createDeviceDto.status,
        plantId: createDeviceDto.plantId,
      },
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
