import { IsNotEmpty, IsString } from 'class-validator';

export class AddDeviceToPlantDto {
  @IsString()
  @IsNotEmpty()
  serialNumber: string;
}
