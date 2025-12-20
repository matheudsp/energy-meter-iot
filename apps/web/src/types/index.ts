export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Plant {
  id: string;
  name: string;
  address: string | null;
  ownerId: string;
  owner?: User;
  _count?: {
    units: number;
    devices: number;
  };
  units?: Unit[];
  devices?: any[];
}

export interface ChannelTelemetry {
  channel: number;
  voltage: number;
  current: number;
  power: number;
}

export interface UnitTelemetry {
  power: number;
  totalKwh: number;
  monthlyKwh: number;
  lastUpdate: string | null;
  isOnline: boolean;
  channels: ChannelTelemetry[];
}

export interface ChannelMap {
  id: string;
  deviceId: string;
  channelIndex: number;
  unitId: string;
}

export interface Unit {
  id: string;
  name: string;
  plantId?: string;
  plant?: Plant;
  telemetry?: UnitTelemetry;
  channelMaps?: ChannelMap[];
}

export interface HistoryPoint {
  _time: string;
  _value: number;
}

export interface MetricSeries {
  channel: number;
  deviceId: string;
  metric: "voltage" | "current" | "power" | "total_kwh";
  data: HistoryPoint[];
}
