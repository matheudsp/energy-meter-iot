import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Unit } from "../types";

async function fetchUnits(): Promise<Unit[]> {
  const { data } = await api.get("/units");
  return data;
}

export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: fetchUnits,
    refetchInterval: 5000,
  });
}
