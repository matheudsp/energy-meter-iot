import { IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
}

export class EnvConfig {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  PORT = 3000;

  @IsString()
  DB_HOST: string;

  @IsNumber()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  DB_PORT: number;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASS: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  CA_CERT_B64: string;

  @IsString()
  CA_KEY_B64: string;

  @IsString()
  BACKEND_CERT_B64: string;

  @IsString()
  BACKEND_KEY_B64: string;
}
