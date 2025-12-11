export interface ChannelTelemetry {
  channel: number;
  voltage: number;
  current: number;
  power: number;
}

export interface UnitTelemetry {
  power: number;
  totalKwh: number;
  lastUpdate: string | null;
  isOnline: boolean;
  channels: ChannelTelemetry[];
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  plantId?: string;
  telemetry: UnitTelemetry;
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
