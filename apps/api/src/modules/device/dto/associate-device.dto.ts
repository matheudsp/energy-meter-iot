import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class AssociateDeviceDto {
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsUUID()
  @IsNotEmpty()
  plantId: string;
}
