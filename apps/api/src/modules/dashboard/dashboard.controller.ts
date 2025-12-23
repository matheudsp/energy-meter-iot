import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/domain.enums';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.INTEGRATOR, UserRole.TENANT)
  async getOverview(@CurrentUser() user: JwtPayload) {
    if (user.role === UserRole.TENANT) {
      return this.dashboardService.getTenantOverview(user);
    }

    return this.dashboardService.getOverview(user);
  }
}
