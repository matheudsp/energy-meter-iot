export class DashboardOverviewDto {
  kpis: {
    totalPower: number; // Em Watts
    totalEnergyMonth: number; // Em kWh
    energyTrend: number; // % de variação vs mês anterior
    activePlants: number;
    totalUnits: number;
    deviceStatus: {
      total: number;
      online: number;
      offline: number;
    };
  };
  topConsumers: {
    unitId: string;
    unitName: string;
    plantName: string;
    consumption: number;
    power: number;
  }[];
  consumptionHistory: {
    date: string;
    value: number;
  }[]; // Para o gráfico de linha (últimos 30 dias)
}
