export interface InfluxChannelData {
  _time: string;
  device_id: string;
  channel_id: string;
  voltage: number;
  current: number;
  power: number;
  total_kwh: number;
}

export interface ChannelTelemetry {
  channel: number;
  voltage: number;
  current: number;
  power: number;
  monthlyKwh: number;
}

export interface UnitTelemetry {
  power: number;
  totalKwh: number;
  monthlyKwh: number;
  lastUpdate: Date | null;
  isOnline: boolean;
  channels: ChannelTelemetry[];
}

export interface UnitWithDeviceRelations {
  id: string;
  name: string;
  plantId: string;
  channelMaps: Array<{
    channelIndex: number;
    deletedAt: Date | null;
    device: {
      serialNumber: string;
      lastSeenAt: Date | null;
    };
  }>;
  [key: string]: unknown; // Permite outros campos do modelo Prisma
}
