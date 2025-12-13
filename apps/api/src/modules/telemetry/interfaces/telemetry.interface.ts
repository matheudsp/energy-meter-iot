export interface ChannelData {
  voltage: number; // Tensão (V)
  current: number; // Corrente (A)
  power: number; // Potência Ativa (W)
  total_kwh: number; // Energia Acumulada (Importante para a fatura!)
}

export interface EnergyMeterPayload {
  device_id: string; // Ex: "central_condominio_01"
  timestamp?: number;
  channels: {
    [key: string]: ChannelData; // Ex: "1": { ... }, "2": { ... }
  };
}
