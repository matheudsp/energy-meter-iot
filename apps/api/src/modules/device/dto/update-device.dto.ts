import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDeviceDto } from './create-device.dto';
import { IsEnum, IsOptional, IsObject, IsString } from 'class-validator';
import { DeviceStatus } from '@/common/enums/domain.enums';

export class UpdateDeviceDto extends PartialType(
  OmitType(CreateDeviceDto, ['serialNumber'] as const),
) {
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
