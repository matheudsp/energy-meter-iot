import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/domain.enums';
import type { AssociateDeviceDto } from './dto/associate-device.dto';
import type { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UpdateDeviceDto } from './dto/update-device.dto';

@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
  }

  @Post('associate')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.INTEGRATOR)
  async associate(
    @Body() dto: AssociateDeviceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.deviceService.associateToPlant(
      dto.serialNumber,
      dto.plantId,
      user,
    );
  }
  @Delete(':id/plant')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.INTEGRATOR)
  async dissociate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.deviceService.dissociateFromPlant(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.update(id, updateDeviceDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INTEGRATOR, UserRole.OWNER)
  async findAll() {
    return this.deviceService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INTEGRATOR, UserRole.OWNER)
  async findOne(@Param('id') id: string) {
    return this.deviceService.findOne(id);
  }

  @Post('provision')
  // @Roles(UserRole.ADMIN, UserRole.INTEGRATOR)
  async provision(@Body() dto: { serialNumber: string; csr: string }) {
    return this.deviceService.provisionDevice(dto.serialNumber, dto.csr);
  }
}
