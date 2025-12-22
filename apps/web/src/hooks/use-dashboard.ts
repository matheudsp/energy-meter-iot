import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export interface DashboardData {
  kpis: {
    totalPower: number;
    totalEnergyMonth: number;
    energyTrend: number;
    activePlants: number;
    deviceStatus: { total: number; online: number; offline: number };
  };
  topConsumers: {
    unitId: string;
    unitName: string;
    plantName: string;
    consumption: number;
    power: number;
  }[];
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const { data } = await api.get<DashboardData>("/dashboard/overview");
      return data;
    },
    refetchInterval: 10000, // Atualiza a cada 10s
  });
}
