import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ex: "Kitnet 101"

  @IsUUID()
  @IsNotEmpty()
  plantId: string;
}
