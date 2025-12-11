import { useUnits } from "../hooks/useUnits";
import { Link } from "react-router";
import { Activity, Zap, ArrowRight } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: units, isLoading, error } = useUnits();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="p-10 text-red-500 font-medium">Erro ao conectar API</div>
    );

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto bg-slate-50/50">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Zap className="text-yellow-500 fill-yellow-500" />
          EnergyMeter{" "}
          <span className="text-slate-400 font-normal text-xl">
            | Dashboard
          </span>
        </h1>
        <Button variant="outline">Atualizar Dados</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units?.map((unit) => (
          <Card
            key={unit.id}
            className="hover:shadow-lg transition-shadow duration-300 border-slate-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-slate-800">
                  {unit.name}
                </CardTitle>
                <p className="text-sm text-slate-500 truncate max-w-[150px]">
                  {unit.description || "Sem descrição"}
                </p>
              </div>
              <Badge
                variant={unit.telemetry.isOnline ? "default" : "destructive"}
                className={
                  unit.telemetry.isOnline
                    ? "bg-green-500 hover:bg-green-600"
                    : ""
                }
              >
                {unit.telemetry.isOnline ? "ONLINE" : "OFFLINE"}
              </Badge>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Bloco de Potência */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Potência Atual
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {unit.telemetry.power}
                  </span>
                  <span className="text-xs font-medium text-slate-400">W</span>
                </div>
              </div>

              {/* Bloco de Consumo */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Consumo Total
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-indigo-600">
                    {unit.telemetry.totalKwh}
                  </span>
                  <span className="text-xs font-medium text-indigo-300">
                    kWh
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50/50 pt-4 pb-4 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center text-xs text-slate-400 gap-1.5">
                <Activity size={14} />
                {unit.telemetry.lastUpdate
                  ? new Date(unit.telemetry.lastUpdate).toLocaleTimeString()
                  : "--:--"}
              </div>

              <Link to={`/unit/${unit.id}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Detalhes <ArrowRight size={14} />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
