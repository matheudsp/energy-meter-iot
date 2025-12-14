import { Link } from "react-router";
import {
  ArrowRight,
  Zap,
  HousePlug,
  CloudSync,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Unit } from "@/types";

interface UnitCardProps {
  unit: Unit;
}

export function UnitCard({ unit }: UnitCardProps) {
  return (
    <Link to={`/units/${unit.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer group h-full bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {unit.name}
              </CardTitle>
              {/* <CardDescription>ID: {unit.id}</CardDescription> */}
            </div>
            <Badge
              variant={unit.telemetry.isOnline ? "default" : "destructive"}
              className={cn(
                "text-[10px] px-2 h-5 tracking-wide",
                unit.telemetry.isOnline
                  ? "bg-green-600/15 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-600/25 border-green-200 dark:border-green-800"
                  : "bg-destructive/10 text-destructive dark:bg-destructive/20 hover:bg-destructive/20"
              )}
            >
              {unit.telemetry.isOnline ? "ONLINE" : "OFFLINE"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Zap className="size-4 text-primary/80" /> Potência
            </span>
            <div className="flex items-baseline gap-1 font-semibold text-foreground">
              {unit.telemetry.power}{" "}
              <span className="text-xs text-muted-foreground font-normal">
                W
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-primary/80" /> Mensal
            </span>
            <div className="flex items-baseline gap-1 font-semibold text-foreground">
              {unit.telemetry.monthlyKwh}{" "}
              <span className="text-xs text-muted-foreground font-normal">
                kWh
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <HousePlug className="size-4 text-primary/80" /> Total
            </span>
            <div className="flex items-baseline gap-1 font-semibold text-foreground">
              {unit.telemetry.totalKwh}{" "}
              <span className="text-xs text-muted-foreground font-normal">
                kWh
              </span>
            </div>
          </div>

          <div className="pt-3 mt-1 border-t border-border flex items-center justify-between">
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
              <CloudSync className="size-3" />
              {unit.telemetry.lastUpdate
                ? new Date(unit.telemetry.lastUpdate).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </div>

            <ArrowRight className="size-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
