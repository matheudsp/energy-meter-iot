import { useUnits } from "@/hooks/use-units";
import { usePlants } from "@/hooks/use-plants";
import {
  Zap,
  Activity,
  TrendingUp,
  AlertTriangle,
  Leaf,
  RefreshCw,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlantCard } from "@/components/plant/plant-card";
import { PageError } from "@/components/feedbacks/page-error";

const MOCK_CHART_DATA = [
  { name: "Seg", total: 4000 },
  { name: "Ter", total: 3000 },
  { name: "Qua", total: 2000 },
  { name: "Qui", total: 2780 },
  { name: "Sex", total: 1890 },
  { name: "Sab", total: 2390 },
  { name: "Dom", total: 3490 },
];

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
        <Skeleton className="h-[300px] w-full rounded-xl" />
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

  // --- Cálculos em Tempo Real (KPIs) ---
  const totalPowerW =
    units?.reduce((acc, u) => acc + u.telemetry.power, 0) || 0;
  const totalKwhMonth =
    units?.reduce((acc, u) => acc + (u.telemetry.monthlyKwh || 0), 0) || 0;
  const onlineCount = units?.filter((u) => u.telemetry.isOnline).length || 0;
  const totalDevices = units?.length || 0;
  const offlineCount = totalDevices - onlineCount;

  // Formatação
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
            Monitoramento em tempo real de suas plantas e unidades.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="size-4" /> Atualizar
        </Button>
      </div>

      {/* --- KPI Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Potência Total (Agora)"
          value={powerDisplay}
          icon={Activity}
          description="Soma de todas as unidades"
        />
        <KpiCard
          title="Consumo Mensal"
          value={`${totalKwhMonth.toFixed(1)} kWh`}
          icon={TrendingUp}
          description="Acumulado este mês"
        />
        <KpiCard
          title="Dispositivos Online"
          value={`${onlineCount} / ${totalDevices}`}
          icon={Zap}
          description="Status da rede"
          trend={offlineCount > 0 ? "warning" : "success"}
          trendText={
            offlineCount > 0 ? `${offlineCount} Offline` : "Rede Estável"
          }
        />
        <KpiCard
          title="Economia Estimada"
          value="R$ --,--"
          icon={Leaf}
          description="Comparativo vs. Meta"
        />
      </div>

      {/* --- Main Content Split --- */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* Gráfico Principal (Esquerda) */}
        <Card className="lg:col-span-4 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Consumo Agregado</CardTitle>
            <CardDescription>
              Histórico de consumo total da semana (Simulado)
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_CHART_DATA}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border)"
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
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-primary)"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Consumidores (Direita) */}
        <Card className="lg:col-span-3 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Maiores Consumidores</CardTitle>
            <CardDescription>
              Unidades com maior consumo no mês atual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
                          {unit.telemetry.monthlyKwh} kWh
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {unit.telemetry.power} W
                        </div>
                      </div>
                      <TrendingUp className="size-4 text-primary" />
                    </div>
                  </div>
                ))}

              {(!units || units.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Lista de Plantas --- */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Suas Plantas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants?.map((plant) => (
            <PlantCard plant={plant} />
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
            className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend === "warning" ? "text-destructive" : "text-green-600"
            }`}
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
