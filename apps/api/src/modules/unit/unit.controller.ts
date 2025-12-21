import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ForbiddenException,
  Patch,
  Delete,
} from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UnitResponseDto } from './dto/unit-response.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { UserRole } from '@/common/enums/domain.enums';
import { Roles } from '@/common/decorators/roles.decorator';
import type { UpdateUnitDto } from './dto/update-unit.dto';

@Controller('units')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.INTEGRATOR)
  create(
    @Body() createUnitDto: CreateUnitDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Sem permissão para criar unidades.');
    }
    return this.unitService.create(createUnitDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas as unidades com telemetria em tempo real',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de unidades recuperada com sucesso.',
    type: [UnitResponseDto],
  })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.unitService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.unitService.findOne(id, user);
  }

  @Get(':id/history')
  async getHistory(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'day',
    @Query('metric')
    metric: 'total_kwh' | 'voltage' | 'current' | 'power' | 'all' = 'all',
  ) {
    return this.unitService.getHistory(id, user, period, metric);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.INTEGRATOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.unitService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.INTEGRATOR)
  @ApiOperation({ summary: 'Excluir uma unidade (Soft Delete)' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.unitService.remove(id, user);
  }
}
