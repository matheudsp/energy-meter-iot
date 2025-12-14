import { useUnits } from "@/hooks/use-units";
import { usePlants } from "@/hooks/use-plants";
import {
  Zap,
  Activity,
  TrendingUp,
  AlertTriangle,
  Leaf,
  RefreshCw,
  MoreHorizontal,
  DollarSign,
  Server,
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

// Card de Uso (Adaptado para Energia)
function OperationalStatusCard({
  units,
  totalPower,
  totalKwh,
}: {
  units: Unit[];
  totalPower: number;
  totalKwh: number;
}) {
  // Cálculos baseados nos dados reais
  const totalDevices = units.length || 1;
  const onlineDevices = units.filter((u) => u.telemetry.isOnline).length;
  const onlinePercentage = (onlineDevices / totalDevices) * 100;

  // Metas Simuladas (Idealmente viriam do backend)
  const POWER_CAPACITY_KW = 50; // Ex: Transformador aguenta 50kW
  const powerPercentage = Math.min(
    (totalPower / 1000 / POWER_CAPACITY_KW) * 100,
    100
  );

  const MONTHLY_TARGET_KWH = 2000; // Meta de consumo
  const targetPercentage = Math.min((totalKwh / MONTHLY_TARGET_KWH) * 100, 100);

  const estimatedBill = totalKwh * 0.92; // R$ 0.92 por kWh
  const co2Emission = totalKwh * 0.085; // kg de CO2

  const usageItems = [
    {
      name: "Meta de Consumo Mensal",
      value: `${totalKwh.toFixed(0)} / ${MONTHLY_TARGET_KWH} kWh`,
      percentage: targetPercentage,
      icon: Activity,
    },
    {
      name: "Uso de Capacidade (Demanda)",
      value: `${(totalPower / 1000).toFixed(1)} / ${POWER_CAPACITY_KW} kW`,
      percentage: powerPercentage,
      icon: Server,
    },
    {
      name: "Disponibilidade da Rede",
      value: `${onlineDevices} / ${totalDevices} Medidores`,
      percentage: onlinePercentage,
      icon: Signal,
      color: onlinePercentage < 80 ? "text-destructive" : "text-green-500",
    },
    {
      name: "Fatura Estimada (Mês)",
      value: `R$ ${estimatedBill.toFixed(2)}`,
      percentage: targetPercentage, // Acompanha o consumo
      icon: DollarSign,
    },
    {
      name: "Pegada de Carbono (CO₂)",
      value: `${co2Emission.toFixed(1)} kg`,
      percentage: targetPercentage,
      icon: Leaf,
    },
  ];

  return (
    <Card className="w-full flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Status Operacional
        </CardTitle>
        <div className="text-2xl font-bold text-foreground">
          Visão Geral do Ciclo
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

// Card de Analytics (Adaptado para Consumo kWh)
function EnergyTrendCard() {
  const currentMonthKwh = ANALYTICS_DATA[ANALYTICS_DATA.length - 1].kwh;
  const previousMonthKwh = ANALYTICS_DATA[ANALYTICS_DATA.length - 2].kwh;
  const growth =
    ((currentMonthKwh - previousMonthKwh) / previousMonthKwh) * 100;

  return (
    <Card className="w-full flex flex-col h-full" data-size="sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Tendência de Consumo</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              {currentMonthKwh.toLocaleString()} kWh neste mês
              <Badge
                variant="secondary"
                className={cn(
                  growth > 0
                    ? "text-red-600 bg-red-100 dark:bg-red-900/30"
                    : "text-green-600 bg-green-100 dark:bg-green-900/30"
                )}
              >
                {growth > 0 ? "+" : ""}
                {growth.toFixed(1)}%
              </Badge>
            </CardDescription>
          </div>
          <CardAction>
            <Button variant="outline" size="sm">
              Ver Relatório
            </Button>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="pb-0 flex-1 flex flex-col justify-end">
        <ChartContainer
          config={chartConfig}
          className="aspect-[1/0.45] w-full max-h-[250px]"
        >
          <AreaChart
            data={ANALYTICS_DATA}
            margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillKwh" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-kwh)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-kwh)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" hideLabel />}
            />
            <Area
              dataKey="kwh"
              type="natural"
              fill="url(#fillKwh)"
              stroke="var(--color-kwh)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// --- DASHBOARD PRINCIPAL ---

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

  // Cálculos de KPIs
  const totalPowerW =
    units?.reduce((acc, u) => acc + u.telemetry.power, 0) || 0;
  const totalKwhMonth =
    units?.reduce((acc, u) => acc + (u.telemetry.monthlyKwh || 0), 0) || 0;
  const onlineCount = units?.filter((u) => u.telemetry.isOnline).length || 0;
  const totalDevices = units?.length || 0;
  const offlineCount = totalDevices - onlineCount;

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
          description="Acumulado no ciclo atual"
        />
        <KpiCard
          title="Status da Rede"
          value={`${onlineCount} / ${totalDevices} Online`}
          icon={Signal}
          description="Conectividade dos medidores"
          trend={offlineCount > 0 ? "warning" : "success"}
          trendText={offlineCount > 0 ? `${offlineCount} Offline` : "Estável"}
        />
        <KpiCard
          title="Custo Estimado"
          value={`R$ ${(totalKwhMonth * 0.92).toFixed(2)}`}
          icon={DollarSign}
          description="Tarifa base: R$ 0,92/kWh"
        />
      </div>

      {/* --- NOVA SEÇÃO: ANALYTICS & USAGE (Estilo Vercel) --- */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="size-4 text-primary" /> Métricas Operacionais
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Passamos os dados reais para o Card */}
          <OperationalStatusCard
            units={units || []}
            totalPower={totalPowerW}
            totalKwh={totalKwhMonth}
          />
          <EnergyTrendCard />
        </div>
      </div>

      {/* Gráfico Detalhado e Top Consumidores */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        <Card className="lg:col-span-4 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Curva de Carga (7 Dias)</CardTitle>
            <CardDescription>
              Perfil de consumo horário médio (Simulado)
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_WEEKLY_DATA}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}kWh`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--primary)"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
