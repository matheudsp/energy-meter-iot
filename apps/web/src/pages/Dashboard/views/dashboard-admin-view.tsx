import { useState } from "react";
import {
  Activity,
  TrendingUp,
  Building2,
  Wifi,
  MoreHorizontal,
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlantCard } from "@/components/plant/plant-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OperationalStatusCard } from "@/components/dashboard/operational-status-card";
import { CircularGauge } from "@/components/ui/circular-gauge";

interface DashboardAdminViewProps {
  data: any;
  isLoading: boolean;
  plants: any[];
  isPlantsLoading: boolean;
}

export function DashboardAdminView({
  data: dashboardData,
  isLoading: isDashboardLoading,
  plants,
  isPlantsLoading,
}: DashboardAdminViewProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const totalPowerW = dashboardData?.kpis.totalPower || 0;
  const powerDisplay =
    totalPowerW >= 1000
      ? `${(totalPowerW / 1000).toFixed(2)} kW`
      : `${totalPowerW.toFixed(0)} W`;

  const energyTrend = dashboardData?.kpis.energyTrend || 0;
  const trendStatus =
    energyTrend > 0 ? "warning" : energyTrend < 0 ? "positive" : undefined;

  let trendLabel = "Estável vs mês anterior";
  if (energyTrend > 0) trendLabel = `Aumento de ${energyTrend.toFixed(1)}%`;
  if (energyTrend < 0)
    trendLabel = `Economia de ${Math.abs(energyTrend).toFixed(1)}%`;

  const sortedConsumers = [...(dashboardData?.topConsumers || [])].sort(
    (a, b) => {
      const valA = a.consumption || 0;
      const valB = b.consumption || 0;
      return sortOrder === "desc" ? valB - valA : valA - valB;
    }
  );

  if (isDashboardLoading || isPlantsLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 md:w-64" />
          <Skeleton className="h-10 w-24 md:w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-64">
          <Skeleton className="lg:col-span-1 h-full rounded-xl" />
          <Skeleton className="lg:col-span-2 h-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Potência Ativa (Agora)"
          value={powerDisplay}
          icon={Activity}
          description="Demanda instantânea total"
        />
        <KpiCard
          title="Consumo Mensal"
          value={`${dashboardData?.kpis.totalEnergyMonth.toFixed(1)} kWh`}
          icon={TrendingUp}
          description="Acumulado no mês atual"
          trend={trendStatus}
          trendText={trendLabel}
        />
        <KpiCard
          title="Dispositivos Online"
          value={`${dashboardData?.kpis.deviceStatus.online} / ${dashboardData?.kpis.deviceStatus.total}`}
          icon={Wifi}
          description="Status da rede de sensores"
          trend={
            dashboardData?.kpis.deviceStatus.offline === 0
              ? "positive"
              : "warning"
          }
          trendText={
            dashboardData?.kpis.deviceStatus.offline === 0
              ? "Rede estável"
              : `${dashboardData?.kpis.deviceStatus.offline} offline`
          }
        />
        <KpiCard
          title="Plantas Ativas"
          value={dashboardData?.kpis.activePlants || 0}
          icon={Building2}
          description="Locais monitorados"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-3 h-full min-h-[300px]">
          <OperationalStatusCard
            totalKwh={dashboardData?.kpis.totalEnergyMonth || 0}
            onlineDevices={dashboardData?.kpis.deviceStatus.online || 0}
            totalDevices={dashboardData?.kpis.deviceStatus.total || 0}
            className="h-full shadow-sm border-border"
          />
        </div>

        <Card className="lg:col-span-4 border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                {sortOrder === "desc"
                  ? "Maiores Consumidores"
                  : "Menores Consumidores"}
              </CardTitle>
              <CardDescription>
                Ordenado por consumo{" "}
                {sortOrder === "desc" ? "decrescente" : "crescente"}.
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="size-4 text-muted-foreground" />
                  <span className="sr-only">Opções de ordenação</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                  <ArrowDownAZ className="mr-2 size-4 text-muted-foreground" />
                  Maior Consumo
                  {sortOrder === "desc" && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                  <ArrowUpAZ className="mr-2 size-4 text-muted-foreground" />
                  Menor Consumo
                  {sortOrder === "asc" && <Check className="ml-auto size-4" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="flex-1">
            <div className="space-y-5">
              {sortedConsumers.map((consumer, index) => {
                const maxConsumption = Math.max(
                  ...(dashboardData?.topConsumers?.map(
                    (c: any) => c.consumption
                  ) || [1])
                );
                const percentage =
                  ((consumer.consumption || 0) / maxConsumption) * 100;

                return (
                  <div
                    key={consumer.unitId}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute text-[10px] font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <CircularGauge
                          value={percentage}
                          className="size-9"
                          strokeWidth={3}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                          {consumer.unitName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="size-3" />
                          {consumer.plantName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm tabular-nums">
                        {consumer.consumption.toFixed(1)}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          kWh
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        {consumer.power.toFixed(0)} W
                      </div>
                    </div>
                  </div>
                );
              })}

              {!sortedConsumers.length && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                  <Activity className="size-8 mb-2 opacity-20" />
                  Nenhum dado de consumo registrado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          Suas Plantas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants?.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}

          {(!plants || plants.length === 0) && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border border-dashed rounded-xl bg-muted/20">
              <Building2 className="size-10 text-muted-foreground/50 mb-3" />
              <h3 className="font-medium text-foreground">
                Nenhuma planta cadastrada
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Cadastre sua primeira planta para começar a monitorar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
