import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { UserRole } from '@/common/enums/domain.enums';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica se um usuário pode acessar uma Plant específica
   */
  async canAccessPlant(
    userId: string,
    plantId: string,
    userRole: UserRole,
  ): Promise<boolean> {
    // ADMIN tem acesso total
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      select: { ownerId: true },
    });

    if (!plant) {
      return false;
    }

    // OWNER pode acessar suas próprias plantas
    if (userRole === UserRole.OWNER && plant.ownerId === userId) {
      return true;
    }

    // INTEGRATOR pode acessar plantas que ele criou (se o integrator é o owner)
    if (userRole === UserRole.INTEGRATOR && plant.ownerId === userId) {
      return true;
    }

    // TENANT pode acessar plantas se tiver tenancy em alguma unidade dessa planta
    if (userRole === UserRole.TENANT) {
      const hasActiveTenancy = await this.prisma.tenancy.findFirst({
        where: {
          tenantId: userId,
          unit: {
            plantId: plantId,
          },
          deletedAt: null,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      });

      return !!hasActiveTenancy;
    }

    return false;
  }

  /**
   * Verifica se um usuário pode acessar uma Unit específica
   */
  async canAccessUnit(
    userId: string,
    unitId: string,
    userRole: UserRole,
  ): Promise<boolean> {
    // ADMIN tem acesso total
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        plant: {
          select: { ownerId: true },
        },
      },
    });

    if (!unit) {
      return false;
    }

    // OWNER pode acessar unidades de suas plantas
    if (userRole === UserRole.OWNER && unit.plant.ownerId === userId) {
      return true;
    }

    // INTEGRATOR pode acessar unidades de plantas que ele gerencia
    if (userRole === UserRole.INTEGRATOR && unit.plant.ownerId === userId) {
      return true;
    }

    // TENANT pode acessar apenas unidades onde tem tenancy ativa
    if (userRole === UserRole.TENANT) {
      const hasActiveTenancy = await this.prisma.tenancy.findFirst({
        where: {
          unitId: unitId,
          tenantId: userId,
          deletedAt: null,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      });

      return !!hasActiveTenancy;
    }

    return false;
  }

  /**
   * Verifica acesso à planta e LANÇA ERRO se não permitido.
   * Usado para operações de escrita (Update/Delete).
   */
  async requirePlantAccess(
    userId: string,
    plantId: string,
    userRole: UserRole,
  ): Promise<void> {
    if (userRole === UserRole.ADMIN) return;

    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      select: { ownerId: true, deletedAt: true },
    });

    if (!plant || plant.deletedAt) {
      throw new NotFoundException('Planta não encontrada.');
    }

    if (
      (userRole === UserRole.OWNER || userRole === UserRole.INTEGRATOR) &&
      plant.ownerId === userId
    ) {
      return;
    }

    throw new ForbiddenException(
      'Você não tem permissão para alterar esta planta.',
    );
  }

  /**
   * Valida acesso e lança exceção se não permitido
   */
  async requireUnitAccess(
    userId: string,
    unitId: string,
    userRole: UserRole,
  ): Promise<void> {
    const hasAccess = await this.canAccessUnit(userId, unitId, userRole);
    if (!hasAccess) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar esta unidade.',
      );
    }
  }

  /**
   * Retorna os IDs de plantas que o usuário pode acessar
   */
  async getAccessiblePlantIds(
    userId: string,
    userRole: UserRole,
  ): Promise<string[]> {
    // ADMIN tem acesso a tudo
    if (userRole === UserRole.ADMIN) {
      const plants = await this.prisma.plant.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });
      return plants.map((p) => p.id);
    }

    // OWNER e INTEGRATOR acessam plantas que possuem
    if (userRole === UserRole.OWNER || userRole === UserRole.INTEGRATOR) {
      const plants = await this.prisma.plant.findMany({
        where: {
          ownerId: userId,
          deletedAt: null,
        },
        select: { id: true },
      });
      return plants.map((p) => p.id);
    }

    // TENANT acessa plantas onde tem tenancy ativa em alguma unidade
    if (userRole === UserRole.TENANT) {
      const tenancies = await this.prisma.tenancy.findMany({
        where: {
          tenantId: userId,
          deletedAt: null,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        include: {
          unit: {
            select: { plantId: true },
          },
        },
      });

      // Retorna IDs únicos de plantas
      const plantIds = [...new Set(tenancies.map((t) => t.unit.plantId))];
      return plantIds;
    }

    return [];
  }

  /**
   * Valida acesso de LEITURA à planta e lança exceção se não permitido.
   * Permite Admin, Owner, Integrator e Tenant (se tiver contrato).
   */
  async requirePlantReadAccess(
    userId: string,
    plantId: string,
    userRole: UserRole,
  ): Promise<void> {
    const hasAccess = await this.canAccessPlant(userId, plantId, userRole);
    if (!hasAccess) {
      throw new ForbiddenException(
        'Você não tem permissão para visualizar esta planta.',
      );
    }
  }

  /**
   * Retorna os IDs de unidades que o usuário pode acessar
   */
  async getAccessibleUnitIds(
    userId: string,
    userRole: UserRole,
  ): Promise<string[]> {
    // ADMIN tem acesso a tudo
    if (userRole === UserRole.ADMIN) {
      const units = await this.prisma.unit.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });
      return units.map((u) => u.id);
    }

    // OWNER e INTEGRATOR acessam unidades de suas plantas
    if (userRole === UserRole.OWNER || userRole === UserRole.INTEGRATOR) {
      const units = await this.prisma.unit.findMany({
        where: {
          deletedAt: null,
          plant: {
            ownerId: userId,
            deletedAt: null,
          },
        },
        select: { id: true },
      });
      return units.map((u) => u.id);
    }

    // TENANT acessa apenas unidades onde tem tenancy ativa
    if (userRole === UserRole.TENANT) {
      const tenancies = await this.prisma.tenancy.findMany({
        where: {
          tenantId: userId,
          deletedAt: null,
          startDate: { lte: new Date() },
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
        select: { unitId: true },
      });

      return tenancies.map((t) => t.unitId);
    }

    return [];
  }

  /**
   * Constrói where clause do Prisma para filtrar plants acessíveis
   */
  getPlantAccessFilter(userId: string, userRole: UserRole) {
    // ADMIN vê tudo
    if (userRole === UserRole.ADMIN) {
      return { deletedAt: null };
    }

    // OWNER e INTEGRATOR veem suas próprias plantas
    if (userRole === UserRole.OWNER || userRole === UserRole.INTEGRATOR) {
      return {
        ownerId: userId,
        deletedAt: null,
      };
    }

    // TENANT vê plantas onde tem tenancy ativa
    if (userRole === UserRole.TENANT) {
      return {
        deletedAt: null,
        units: {
          some: {
            tenancies: {
              some: {
                tenantId: userId,
                deletedAt: null,
                startDate: { lte: new Date() },
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
              },
            },
          },
        },
      };
    }

    // Fallback: nenhum resultado
    return { id: 'impossible-id-no-access' };
  }

  /**
   * Constrói where clause do Prisma para filtrar units acessíveis
   */
  getUnitAccessFilter(userId: string, userRole: UserRole) {
    // ADMIN vê tudo
    if (userRole === UserRole.ADMIN) {
      return { deletedAt: null };
    }

    // OWNER e INTEGRATOR veem unidades de suas plantas
    if (userRole === UserRole.OWNER || userRole === UserRole.INTEGRATOR) {
      return {
        deletedAt: null,
        plant: {
          ownerId: userId,
          deletedAt: null,
        },
      };
    }

    // TENANT vê apenas unidades onde tem tenancy ativa
    if (userRole === UserRole.TENANT) {
      return {
        deletedAt: null,
        tenancies: {
          some: {
            tenantId: userId,
            deletedAt: null,
            startDate: { lte: new Date() },
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
        },
      };
    }

    // Fallback: nenhum resultado
    return { id: 'impossible-id-no-access' };
  }
}
