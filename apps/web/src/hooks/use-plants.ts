import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Plant } from "../types";

async function fetchPlants(): Promise<Plant[]> {
  const { data } = await api.get("/plants");
  return data;
}

export function usePlants(options?: Partial<UseQueryOptions<Plant[], Error>>) {
  return useQuery({
    queryKey: ["plants"],
    queryFn: fetchPlants,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}
