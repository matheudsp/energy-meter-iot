import { DeviceStatus } from '@/common/enums/domain.enums';
import { IsString, IsNotEmpty, IsUUID, IsEnum } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsEnum(DeviceStatus)
  status: DeviceStatus;

  @IsUUID()
  @IsNotEmpty()
  plantId: string;
}
