import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateChannelMapDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId: string; // Qual dispositivo?

  @IsUUID()
  @IsNotEmpty()
  unitId: string; // Qual apartamento/kitnet?

  @IsNumber()
  @Min(1)
  channelNumber: number; // Qual canal (1, 2, 3...)?
}
