import { Activity, TrendingUp, Building2, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CircularGauge } from "@/components/ui/circular-gauge";

interface DashboardTenantViewProps {
  data: any;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardTenantView({
  data,
  isLoading,
}: DashboardTenantViewProps) {
  const kpis = data?.kpis;

  const units = data?.topConsumers || [];

  const energyTrend = kpis?.energyTrend || 0;
  const trendStatus =
    energyTrend > 0 ? "warning" : energyTrend < 0 ? "positive" : undefined;

  let trendLabel = "Estável vs mês anterior";
  if (energyTrend > 0) trendLabel = `Aumento de ${energyTrend.toFixed(1)}%`;
  if (energyTrend < 0)
    trendLabel = `Economia de ${Math.abs(energyTrend).toFixed(1)}%`;

  const totalPowerW = kpis?.totalPower || 0;
  const powerDisplay =
    totalPowerW >= 1000
      ? `${(totalPowerW / 1000).toFixed(2)} kW`
      : `${totalPowerW.toFixed(0)} W`;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Consumo Mensal"
          value={`${kpis?.totalEnergyMonth.toFixed(1)} kWh`}
          icon={TrendingUp}
          description="Total acumulado este mês"
          trend={trendStatus}
          trendText={trendLabel}
        />
        <KpiCard
          title="Potência Atual"
          value={powerDisplay}
          icon={Activity}
          description="Demanda instantânea"
        />
        <KpiCard
          title="Unidades Ativas"
          value={kpis?.totalUnits || 0}
          icon={Home}
          description="Imóveis monitorados"
        />
      </div>

      {/* Lista de Unidades do Inquilino */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Minhas Unidades
          </CardTitle>
          <CardDescription>
            Visão detalhada do consumo por unidade imobiliária.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {units.length > 0 ? (
              units.map((unit: any) => {
                const maxConsumption = Math.max(
                  ...units.map((u: any) => u.consumption)
                );
                // Evita divisão por zero
                const percentage =
                  maxConsumption > 0
                    ? ((unit.consumption || 0) / maxConsumption) * 100
                    : 0;

                return (
                  <div
                    key={unit.unitId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/10 border border-transparent hover:border-border transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <CircularGauge
                        value={percentage}
                        className="size-9"
                        strokeWidth={4}
                        // showValue={false}
                      />
                      <div>
                        <h4 className="font-semibold text-lg text-foreground">
                          {unit.unitName}
                        </h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="size-3" />
                          {unit.plantName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-2 sm:mt-0">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground uppercase font-medium">
                          Consumo
                        </span>
                        <div className="font-bold text-xl tabular-nums">
                          {unit.consumption.toFixed(1)}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            kWh
                          </span>
                        </div>
                      </div>
                      <div className="text-right pl-6 border-l border-border">
                        <span className="text-xs text-muted-foreground uppercase font-medium">
                          Potência
                        </span>
                        <div className="font-bold text-lg tabular-nums text-foreground/80">
                          {unit.power.toFixed(0)}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            W
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="size-10 mx-auto mb-3 opacity-20" />
                <p>Nenhuma unidade vinculada encontrada.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
