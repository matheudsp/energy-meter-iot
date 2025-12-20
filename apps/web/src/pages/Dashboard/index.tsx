import { useUnits } from "@/hooks/use-units";
import { usePlants } from "@/hooks/use-plants";
import {
  Zap,
  Activity,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  DollarSign,
  Signal,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PlantCard } from "@/components/plant/plant-card";
import { PageError } from "@/components/feedbacks/page-error";
import { cn } from "@/lib/utils";
import type { Unit } from "@/types";

// --- MOCK DATA (Simulando histórico que viria do backend) ---
const MOCK_WEEKLY_DATA = [
  { name: "Seg", total: 45 },
  { name: "Ter", total: 52 },
  { name: "Qua", total: 48 },
  { name: "Qui", total: 61 },
  { name: "Sex", total: 55 },
  { name: "Sab", total: 67 },
  { name: "Dom", total: 72 },
];

const ANALYTICS_DATA = [
  { month: "Jan", kwh: 1250 },
  { month: "Fev", kwh: 1400 },
  { month: "Mar", kwh: 1100 },
  { month: "Abr", kwh: 1350 },
  { month: "Mai", kwh: 1500 },
  { month: "Jun", kwh: 1620 },
];

const chartConfig = {
  kwh: {
    label: "Consumo (kWh)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

// --- COMPONENTES VISUAIS ---

function CircularGauge({
  value,
  color = "text-primary",
}: {
  value: number;
  color?: string;
}) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative size-4 shrink-0">
      <svg className="size-full -rotate-90" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-muted/30"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-500 ease-in-out", color)}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function OperationalStatusCard({
  units,
  totalKwh,
}: {
  units: Unit[];
  totalPower: number;
  totalKwh: number;
}) {
  const totalDevices = units.length || 1;
  const onlineDevices = units.filter((u) => u.telemetry.isOnline).length;
  const onlinePercentage = (onlineDevices / totalDevices) * 100;

  const targetPercentage = Math.min(totalKwh * 100, 100);

  const usageItems = [
    {
      name: "Consumo total este mês",
      value: `${totalKwh.toFixed(0)} kWh`,
      percentage: targetPercentage,
      icon: Activity,
    },
    // {
    //   name: "Disponibilidade da rede",
    //   value: `${onlineDevices} / ${totalDevices} Medidores`,
    //   percentage: onlinePercentage,
    //   icon: Signal,
    //   color: onlinePercentage < 80 ? "text-destructive" : "text-green-500",
    // },
  ];

  return (
    <Card className="w-full flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Status Operacional
        </CardTitle>
        <div className="text-2xl font-bold text-foreground">
          Visão Geral do Mês
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="divide-y divide-border border-t border-border">
          {usageItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <CircularGauge value={item.percentage} color={item.color} />
                <span className="text-sm font-medium truncate text-foreground/90 group-hover:text-foreground flex items-center gap-2">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-muted-foreground tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const {
    data: units,
    isLoading: unitsLoading,
    error: unitsError,
    refetch: refetchUnits,
  } = useUnits();
  const {
    data: plants,
    isLoading: plantsLoading,
    refetch: refetchPlants,
  } = usePlants();

  const isLoading = unitsLoading || plantsLoading;
  const error = unitsError;

  const handleRefresh = () => {
    refetchUnits();
    refetchPlants();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PageError
        title="Erro de Conexão"
        message="Não conseguimos carregar o dashboard."
        onRetry={handleRefresh}
      />
    );
  }

  const totalPowerW =
    units?.reduce((acc, u) => acc + u.telemetry.power, 0) || 0;
  const totalKwhMonth =
    units?.reduce((acc, u) => acc + (u.telemetry.monthlyKwh || 0), 0) || 0;
  // TODO - return devices in the response, to calcule devices here.
  // const onlineCount = units?.filter((u) => u.telemetry.isOnline).length || 0;
  // const totalDevices = units?.length || 0;
  // const offlineCount = totalDevices - onlineCount;

  const powerDisplay =
    totalPowerW > 1000
      ? `${(totalPowerW / 1000).toFixed(1)} kW`
      : `${totalPowerW.toFixed(0)} W`;

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 bg-background/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="text-primary fill-primary" />
            EnergyMeter
            <span className="text-muted-foreground font-normal text-xl hidden sm:inline-block">
              | Visão Geral
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento inteligente e gestão de eficiência energética.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="size-4" /> Atualizar
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Potência Ativa (Agora)"
          value={powerDisplay}
          icon={Activity}
          description="Demanda instantânea total"
        />
        <KpiCard
          title="Consumo Mensal"
          value={`${totalKwhMonth.toFixed(1)} kWh`}
          icon={TrendingUp}
          description="Acumulado no mês atual"
        />
        {/* <KpiCard
          title="Status da Rede"
          value={`${onlineCount} / ${totalDevices} Online`}
          icon={Signal}
          description="Conectividade dos medidores"
          trend={offlineCount > 0 ? "warning" : "success"}
          trendText={offlineCount > 0 ? `${offlineCount} Offline` : "Estável"}
        /> */}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="size-4 text-primary" /> Métricas Operacionais
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <OperationalStatusCard
            units={units || []}
            totalPower={totalPowerW}
            totalKwh={totalKwhMonth}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* Top Consumidores */}
        <Card className="lg:col-span-3 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Top Consumidores</CardTitle>
              <CardDescription>
                Unidades com maior impacto no ciclo.
              </CardDescription>
            </div>
            <MoreHorizontal className="size-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-4">
              {units
                ?.sort(
                  (a, b) =>
                    (b.telemetry.monthlyKwh || 0) -
                    (a.telemetry.monthlyKwh || 0)
                )
                .slice(0, 5)
                .map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {unit.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {unit.plant?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-bold">
                          {unit.telemetry.monthlyKwh?.toFixed(1)} kWh
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {unit.telemetry.power} W
                        </div>
                      </div>
                      <TrendingUp className="size-4 text-primary" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Plantas */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Suas Plantas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants?.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
          {(!plants || plants.length === 0) && (
            <div className="col-span-full py-10 text-center border border-dashed rounded-xl bg-muted/20 text-muted-foreground">
              Nenhuma planta cadastrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar simples para os KPIs
function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendText,
}: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trend === "warning" ? "text-destructive" : "text-green-600"
            )}
          >
            {trend === "warning" ? (
              <AlertTriangle size={12} />
            ) : (
              <Zap size={12} />
            )}
            {trendText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
