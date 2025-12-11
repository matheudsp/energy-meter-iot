import {
  PrismaClient,
  Prisma,
  UserRole,
  DeviceStatus,
} from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

async function main() {
  console.log('🌱 Iniciando Seed do Banco de Dados...');

  // 1. Limpar dados existentes (A ordem importa para evitar erros de Foreign Key)
  await prisma.channelMap.deleteMany();
  await prisma.tenancy.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.device.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Dados antigos limpos.');

  // Gerar hashes de senha
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordOwner = await bcrypt.hash('owner123', 10);
  const passwordTenant = await bcrypt.hash('tenant123', 10);

  // --------------------------------------------------------
  // 2. Criar Usuários
  // --------------------------------------------------------

  // ADMIN
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@energymeter.com',
      passwordHash: passwordAdmin,
      role: UserRole.ADMIN,
    },
  });

  // OWNER (Síndico)
  const owner = await prisma.user.create({
    data: {
      name: 'João Síndico',
      email: 'joao@condominio.com',
      passwordHash: passwordOwner,
      role: UserRole.OWNER,
    },
  });

  // TENANTS (Moradores)
  const tenant1 = await prisma.user.create({
    data: {
      name: 'Maria Inquilina',
      email: 'maria@apt101.com',
      passwordHash: passwordTenant,
      role: UserRole.TENANT,
    },
  });

  const tenant2 = await prisma.user.create({
    data: {
      name: 'José Morador',
      email: 'jose@apt102.com',
      passwordHash: passwordTenant,
      role: UserRole.TENANT,
    },
  });

  console.log('👥 Usuários criados (Admin, Owner, Tenants).');

  // --------------------------------------------------------
  // 3. Criar Infraestrutura (Planta e Dispositivo)
  // --------------------------------------------------------

  const plant = await prisma.plant.create({
    data: {
      name: 'Condomínio Solar Ville',
      address: 'Rua do Sol, 100',
      ownerId: owner.id,
    },
  });

  // Dispositivo Central (Simulado)
  const device = await prisma.device.create({
    data: {
      serialNumber: 'central_simulada_01',
      status: DeviceStatus.PROVISIONED,
      plantId: plant.id,
    },
  });

  console.log(`🏭 Planta e Dispositivo (${device.serialNumber}) criados.`);

  // --------------------------------------------------------
  // 4. Criar Unidades e Contratos (Tenancies)
  // --------------------------------------------------------

  // Unidade 101
  const unit1 = await prisma.unit.create({
    data: {
      name: 'Apto 101',
      plantId: plant.id,
    },
  });

  // Contrato Ativo para Apto 101 -> Maria
  await prisma.tenancy.create({
    data: {
      unitId: unit1.id,
      tenantId: tenant1.id,
      startDate: new Date(),
    },
  });

  // Unidade 102
  const unit2 = await prisma.unit.create({
    data: {
      name: 'Apto 102',
      plantId: plant.id,
    },
  });

  // Contrato Ativo para Apto 102 -> José
  await prisma.tenancy.create({
    data: {
      unitId: unit2.id,
      tenantId: tenant2.id,
      startDate: new Date(),
    },
  });

  console.log('🏠 Unidades e contratos de locação gerados.');

  // --------------------------------------------------------
  // 5. Mapeamento de Canais (Físico -> Lógico)
  // --------------------------------------------------------

  // Canal 1 -> Apto 101
  await prisma.channelMap.create({
    data: {
      deviceId: device.id,
      channelIndex: 1,
      unitId: unit1.id,
    },
  });

  // Canal 2 -> Apto 102
  await prisma.channelMap.create({
    data: {
      deviceId: device.id,
      channelIndex: 2,
      unitId: unit2.id,
    },
  });

  console.log('🔌 Canais mapeados com sucesso.');

  console.log('\n================================================');
  console.log('✅ SEED CONCLUÍDO! Credenciais de acesso:');
  console.log('================================================');
  console.log('👑 ADMIN:  admin@energymeter.com / admin123');
  console.log('🏢 OWNER:  joao@condominio.com   / owner123');
  console.log('👤 TENANT: maria@apt101.com      / tenant123');
  console.log('👤 TENANT: jose@apt102.com       / tenant123');
  console.log('================================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
