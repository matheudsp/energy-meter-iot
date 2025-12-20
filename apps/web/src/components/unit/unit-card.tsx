import { useState, type MouseEvent } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Zap,
  HousePlug,
  CloudSync,
  TrendingUp,
  Pencil,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Unit } from "@/types";
import {
  EditUnitForm,
  type OccupiedChannel,
} from "@/components/forms/unit/edit-unit-form";

interface UnitCardProps {
  unit: Unit;
  devices?: { id: string; serialNumber: string }[];
  occupiedChannels?: OccupiedChannel[];
  onUpdate?: () => void;
  showActions?: boolean;
}

export function UnitCard({
  unit,
  devices = [],
  occupiedChannels = [],
  onUpdate,
  showActions = false,
}: UnitCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleActionClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="relative group h-full min-w-[260px]">
      {showActions && (
        <div
          className="absolute top-3 right-3 z-20"
          onClick={handleActionClick}
        >
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 hover:bg-secondary/80 data-[state=open]:bg-secondary/80"
                >
                  <MoreVertical className="size-4 text-muted-foreground" />
                  <span className="sr-only">Ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>

                <DropdownMenuItem
                  onSelect={() => setIsEditDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <Pencil className="mr-2 size-4" /> Editar
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onSelect={(e: MouseEvent) => {
                    alert("Excluir unidade");
                  }}
                >
                  <Trash2 className="mr-2 size-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent onClick={(e: MouseEvent) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Editar Unidade</DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <EditUnitForm
                  unit={unit}
                  devices={devices}
                  occupiedChannels={occupiedChannels}
                  onSuccess={() => {
                    setIsEditDialogOpen(false);
                    onUpdate?.();
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Link to={`/units/${unit.id}`} className="block h-full">
        <Card className="hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer h-full bg-card border-border">
          <CardHeader className={cn("pb-3", showActions && "pr-12")}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">
                  {unit.name}
                </CardTitle>
              </div>
              <Badge
                variant={unit.telemetry?.isOnline ? "default" : "destructive"}
                className={cn(
                  "text-[10px] px-2 h-5 tracking-wide shrink-0",
                  unit.telemetry?.isOnline
                    ? "bg-green-600/15 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-600/25 border-green-200 dark:border-green-800"
                    : "bg-destructive/10 text-destructive dark:bg-destructive/20 hover:bg-destructive/20"
                )}
              >
                {unit.telemetry?.isOnline ? "ONLINE" : "OFFLINE"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Zap className="size-4 text-primary/80" /> Potência
              </span>
              <div className="flex items-baseline gap-1 font-semibold text-foreground">
                {unit.telemetry?.power || 0}{" "}
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
                {unit.telemetry?.monthlyKwh || 0}{" "}
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
                {unit.telemetry?.totalKwh || 0}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  kWh
                </span>
              </div>
            </div>

            <div className="pt-3 mt-1 border-t border-border flex items-center justify-between">
              <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                <CloudSync className="size-3" />
                {unit.telemetry?.lastUpdate
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
    </div>
  );
}
