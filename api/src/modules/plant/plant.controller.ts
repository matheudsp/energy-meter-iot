import { Controller, Get, Param } from '@nestjs/common';
import { PlantService } from './plant.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

@Controller('plants')
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  // @Post()
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
