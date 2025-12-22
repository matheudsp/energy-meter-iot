import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularGauge } from "@/components/ui/circular-gauge";
import { cn } from "@/lib/utils";

interface StatusItem {
  id: string;
  label: string;
  value: string;
  percentage: number;

  color?: string;
}

interface OperationalStatusCardProps {
  totalKwh: number;
  onlineDevices: number;
  totalDevices: number;
  className?: string;
}

export function OperationalStatusCard({
  totalKwh,
  onlineDevices,
  totalDevices,
  className,
}: OperationalStatusCardProps) {
  const onlinePercentage =
    totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

  const statusItems: StatusItem[] = [
    {
      id: "consumption",
      label: "Consumo total este mês",
      value: `${totalKwh.toLocaleString("pt-BR", {
        maximumFractionDigits: 0,
      })} kWh`,
      percentage: 75,

      color: "text-primary",
    },
    {
      id: "network",
      label: "Disponibilidade da rede",
      value: `${onlineDevices}/${totalDevices} Medidores`,
      percentage: onlinePercentage,

      color:
        onlinePercentage < 80
          ? "text-destructive"
          : "text-green-600 dark:text-green-500",
    },
  ];

  return (
    <Card className={cn("w-full flex flex-col h-full", className)}>
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
          {statusItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <CircularGauge
                  value={item.percentage}
                  className="size-4"
                  color={item.color}
                  strokeWidth={5}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate text-foreground/90 group-hover:text-foreground">
                    {item.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium text-muted-foreground tabular-nums">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
