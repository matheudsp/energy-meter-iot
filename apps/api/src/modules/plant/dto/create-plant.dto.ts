import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreatePlantDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ex: "Condomínio Solar"

  @IsString()
  @IsNotEmpty()
  address: string;
}
