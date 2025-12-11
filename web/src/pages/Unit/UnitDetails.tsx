import { useState } from "react";
import { useParams, Link } from "react-router";
import { useUnitHistory, type HistoryPeriod } from "../../hooks/useUnitHistory";
import { ArrowLeft } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SmartChart = ({ title, dataSeries, color, unit, period }: any) => {
  if (!dataSeries || dataSeries.length === 0) return null;

  const metricName = dataSeries[0].metric;
  const data = dataSeries[0].data;

  // Se for Consumo (kWh) E o período for maior que 'day', usa Barra.
  const isBarChart = metricName === "total_kwh" && period !== "day";

  // Formatação da Data no Eixo X
  const dateFormatter = (str: string) => {
    const date = new Date(str);
    if (period === "day") return format(date, "HH:mm");
    if (period === "year") return format(date, "MMM", { locale: ptBR });
    return format(date, "dd/MM"); // Semana ou Mês
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-700 flex justify-between">
        {title}
        <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">
          {isBarChart ? "Consumo por Período" : "Curva de Carga"}
        </span>
      </h3>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {isBarChart ? (
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="_time"
                tickFormatter={dateFormatter}
                stroke="#94a3b8"
                fontSize={12}
                tickMargin={10}
              />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                labelFormatter={(label) =>
                  format(
                    new Date(label),
                    "dd " + (period === "year" ? "MMMM" : "MMM, HH:mm"),
                    { locale: ptBR }
                  )
                }
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar
                dataKey="_value"
                fill={color}
                radius={[4, 4, 0, 0]}
                name={unit}
                maxBarSize={60}
              />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="_time"
                tickFormatter={dateFormatter}
                stroke="#94a3b8"
                fontSize={12}
                minTickGap={30}
              />
              <YAxis stroke="#94a3b8" fontSize={12} domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={(label) =>
                  format(new Date(label), "dd/MM HH:mm")
                }
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="_value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name={unit}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function UnitDetails() {
  const { id } = useParams<{ id: string }>();
  const [period, setPeriod] = useState<HistoryPeriod>("day");
  const { data, isLoading } = useUnitHistory(id!, period);

  if (isLoading)
    return (
      <div className="p-10 flex justify-center text-slate-500">
        Carregando dados...
      </div>
    );

  // Filtra as séries
  const voltageSeries = data?.filter((d) => d.metric === "voltage");
  const currentSeries = data?.filter((d) => d.metric === "current");
  const powerSeries = data?.filter((d) => d.metric === "power");
  const kwhSeries = data?.filter((d) => d.metric === "total_kwh");

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto bg-slate-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link
            to="/"
            className="flex items-center text-slate-500 hover:text-blue-600 mb-2 transition-colors font-medium"
          >
            <ArrowLeft size={18} className="mr-1" /> Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">
            Detalhes da Unidade
          </h1>
        </div>

        {/* Seletor de Período */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
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
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 gap-6">
        {/* Gráfico de Consumo (Destaque) */}
        <SmartChart
          title="Consumo de Energia"
          dataSeries={kwhSeries}
          color="#8b5cf6"
          unit="kWh"
          period={period}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SmartChart
            title="Potência Ativa"
            dataSeries={powerSeries}
            color="#f59e0b"
            unit="W"
            period={period}
          />
          <SmartChart
            title="Tensão"
            dataSeries={voltageSeries}
            color="#3b82f6"
            unit="V"
            period={period}
          />
        </div>

        {/* Corrente (Opcional ou abaixo) */}
        <SmartChart
          title="Corrente"
          dataSeries={currentSeries}
          color="#ef4444"
          unit="A"
          period={period}
        />
      </div>
    </div>
  );
}
