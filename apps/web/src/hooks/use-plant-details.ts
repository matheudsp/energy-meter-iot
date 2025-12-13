import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Plant } from "../types";

interface PlantDetails extends Plant {
  units: any[];
  devices: any[];
}

async function fetchPlantDetails(id: string): Promise<PlantDetails> {
  const { data } = await api.get(`/plants/${id}`);
  return data;
}

export function usePlantDetails(id: string) {
  return useQuery({
    queryKey: ["plant", id],
    queryFn: () => fetchPlantDetails(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
