import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '@/common/enums/domain.enums';

export class RegisterDto {
  @ApiProperty({ example: 'João da Silva', description: 'Nome completo' })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  name: string;

  @ApiProperty({ example: 'joao@email.com', description: 'E-mail único' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'senhaForte123', description: 'Senha para login' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.TENANT,
    description: 'Tipo de usuário',
  })
  @IsEnum(UserRole, { message: 'Papel de usuário inválido.' })
  role: UserRole;
}
