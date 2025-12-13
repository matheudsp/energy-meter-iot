import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/domain.enums';

@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
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
