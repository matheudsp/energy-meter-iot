import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
  }

  @Get()
  findAll() {
    return this.deviceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deviceService.findOne(id);
  }

  @Post('provision')
  async provision(@Body() dto: { serialNumber: string; csr: string }) {
    return this.deviceService.provisionDevice(dto.serialNumber, dto.csr);
  }
}
