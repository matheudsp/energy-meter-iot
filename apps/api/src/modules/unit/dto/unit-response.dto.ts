import { ApiProperty } from '@nestjs/swagger';

export class Unit {
  @ApiProperty({ description: 'ID único da unidade (UUID)' })
  id: string;

  @ApiProperty({ description: 'Nome da unidade (Ex: Apto 101)' })
  name: string;

  @ApiProperty({ description: 'ID da planta vinculada' })
  plantId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  deletedAt: Date | null;
}

export class ChannelTelemetryDto {
  @ApiProperty({ example: 1, description: 'Número do canal no medidor' })
  channel: number;

  @ApiProperty({ example: 127.5, description: 'Tensão instantânea (V)' })
  voltage: number;

  @ApiProperty({ example: 2.5, description: 'Corrente instantânea (A)' })
  current: number;

  @ApiProperty({ example: 318.75, description: 'Potência instantânea (W)' })
  power: number;
}

export class UnitTelemetryDto {
  @ApiProperty({ example: 1500.5, description: 'Potência total consumida (W)' })
  power: number;

  @ApiProperty({ example: 450.2, description: 'Leitura acumulada total (kWh)' })
  totalKwh: number;

  @ApiProperty({
    example: '2023-10-27T10:00:00Z',
    description: 'Data da última leitura recebida',
    nullable: true,
  })
  lastUpdate: Date | null;

  @ApiProperty({
    example: true,
    description: 'Status online (baseado no último update < 5min)',
  })
  isOnline: boolean;

  @ApiProperty({ type: [ChannelTelemetryDto] })
  channels: ChannelTelemetryDto[];
}

export class UnitResponseDto extends Unit {
  @ApiProperty({ type: UnitTelemetryDto })
  telemetry: UnitTelemetryDto;
}
