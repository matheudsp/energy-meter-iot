import { type LucideIcon, AlertTriangle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "positive" | "warning";
  trendText?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendText,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold truncate">{value}</div>

        {description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {description}
          </p>
        )}

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trend === "warning"
                ? "text-destructive"
                : "text-green-600 dark:text-green-500"
            )}
          >
            {trend === "warning" ? (
              <AlertTriangle className="size-3" />
            ) : (
              <Zap className="size-3" />
            )}
            <span>{trendText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
