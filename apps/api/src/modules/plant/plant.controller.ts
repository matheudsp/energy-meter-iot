import { Controller, Get, Param } from '@nestjs/common';
import { PlantService } from './plant.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/domain.enums';

@Controller('plants')
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  // @Post()
  // @Roles(UserRole.ADMIN, UserRole.INTEGRATOR, UserRole.OWNER)
  // create(@Body() dto: CreatePlantDto) {
  //   return this.plantService.create(dto);
  // }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.plantService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.plantService.findOne(id, user);
  }
}
