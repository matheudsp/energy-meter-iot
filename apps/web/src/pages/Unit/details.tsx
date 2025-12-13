import { useState } from "react";
import { useParams, Link } from "react-router";
import { useUnitHistory, type HistoryPeriod } from "@/hooks/use-unit-history";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PageLoading } from "@/components/feedbacks/page-loading";
import { PageError } from "@/components/feedbacks/page-error";

const chartConfig = {
  voltage: {
    label: "Tensão (V)",
    color: "var(--chart-1)",
  },
  current: {
    label: "Corrente (A)",
    color: "var(--chart-2)",
  },
  power: {
    label: "Potência (W)",
    color: "var(--chart-3)",
  },
  total_kwh: {
    label: "Energia (kWh)",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const SmartChart = ({ title, dataSeries, metric, period }: any) => {
  if (!dataSeries || dataSeries.length === 0) return null;

  const rawData = dataSeries[0].data;

  const chartData = rawData.map((item: any) => ({
    ...item,
    [metric]: item._value,
  }));

  const isBarChart = metric === "total_kwh" && period !== "day";

  const dateFormatter = (str: string) => {
    const date = new Date(str);
    if (period === "day") return format(date, "HH:mm");
    if (period === "year") return format(date, "MMM", { locale: ptBR });
    return format(date, "dd/MM");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {isBarChart
            ? "Consumo acumulado por período"
            : "Monitoramento em tempo real da curva de carga"}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            {isBarChart ? (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="_time"
                  tickFormatter={dateFormatter}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={32}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(val) => `${val}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) =>
                        format(
                          new Date(label),
                          period === "year" ? "MMMM yyyy" : "dd MMM, HH:mm",
                          { locale: ptBR }
                        )
                      }
                    />
                  }
                />
                <Bar
                  dataKey={metric}
                  fill={`var(--color-${metric})`}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="_time"
                  tickFormatter={dateFormatter}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={32}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  domain={["auto", "auto"]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) =>
                        format(new Date(label), "dd/MM HH:mm")
                      }
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke={`var(--color-${metric})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default function UnitDetails() {
  const { id } = useParams<{ id: string }>();
  const [period, setPeriod] = useState<HistoryPeriod>("day");
  const { data, isLoading, error } = useUnitHistory(id!, period);

  if (isLoading) {
    return <PageLoading message="Carregando telemetria..." />;
  }

  if (error) {
    return (
      <PageError
        title="Falha na telemetria"
        message="Não foi possível carregar o histórico desta unidade."
        backLink="/"
        backLabel="Voltar ao início"
        // onRetry={() => window.location.reload()}
      />
    );
  }

  const voltageSeries = data?.filter((d) => d.metric === "voltage");
  const currentSeries = data?.filter((d) => d.metric === "current");
  const powerSeries = data?.filter((d) => d.metric === "power");
  const kwhSeries = data?.filter((d) => d.metric === "total_kwh");

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link
            to="/"
            className="flex items-center text-muted-foreground hover:text-primary mb-2 transition-colors font-medium text-sm"
          >
            <ArrowLeft size={16} className="mr-1" /> Voltar
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Detalhes da Unidade
          </h1>
        </div>

        {/* Seletor de Período */}
        <div className="flex bg-card rounded-lg p-1 shadow-sm border border-border">
          {[
            { id: "day", label: "24h" },
            { id: "week", label: "7 Dias" },
            { id: "month", label: "30 Dias" },
            { id: "year", label: "Ano" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                period === p.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 gap-6">
        <SmartChart
          title="Consumo de Energia"
          dataSeries={kwhSeries}
          metric="total_kwh"
          period={period}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SmartChart
            title="Potência Ativa"
            dataSeries={powerSeries}
            metric="power"
            period={period}
          />
          <SmartChart
            title="Tensão"
            dataSeries={voltageSeries}
            metric="voltage"
            period={period}
          />
        </div>

        <SmartChart
          title="Corrente"
          dataSeries={currentSeries}
          metric="current"
          period={period}
        />
      </div>
    </div>
  );
}
