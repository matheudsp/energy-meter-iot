import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PlantService } from './plant.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/domain.enums';
import type { UpdatePlantDto } from './dto/update-plant.dto';
import type { CreatePlantDto } from './dto/create-plant.dto';

@Controller('plants')
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INTEGRATOR, UserRole.OWNER)
  create(@Body() dto: CreatePlantDto, @CurrentUser() user: JwtPayload) {
    return this.plantService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.plantService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.plantService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.INTEGRATOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.plantService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.INTEGRATOR)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.plantService.remove(id, user);
  }
}
