import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { MetricSeries } from "../types";

export type HistoryPeriod = "day" | "week" | "month";

async function fetchHistory(
  unitId: string,
  period: HistoryPeriod
): Promise<MetricSeries[]> {
  const { data } = await api.get(`/units/${unitId}/history`, {
    params: { period, metric: "all" },
  });
  return data;
}

export function useUnitHistory(unitId: string, period: HistoryPeriod) {
  return useQuery({
    queryKey: ["history", unitId, period],
    queryFn: () => fetchHistory(unitId, period),
    refetchInterval: 60000,
  });
}
