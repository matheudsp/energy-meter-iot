import { useState } from "react";
import { Cpu, MoreVertical, Settings, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/api/client";

interface DeviceCardProps {
  device: {
    id: string;
    serialNumber: string;
    status: string;
    firmwareVersion?: string;
    lastSeenAt?: string;
  };
  onUpdate?: () => void;
}

export function DeviceCard({ device, onUpdate }: DeviceCardProps) {
  const [isDissociateDialogOpen, setIsDissociateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleDissociate() {
    try {
      setIsLoading(true);

      await api.delete(`/devices/${device.id}/plant`);

      toast.success("Dispositivo desvinculado com sucesso.");
      setIsDissociateDialogOpen(false);

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao desvincular dispositivo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3 group">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <div className="bg-muted p-2.5 rounded-full shrink-0 group-hover:bg-background transition-colors border border-transparent group-hover:border-border">
            <Cpu className="size-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-sm truncate">
                {device.serialNumber}
              </p>
              <Badge
                variant={device.status === "ONLINE" ? "default" : "secondary"}
                className={`text-[10px] px-1.5 py-0 shrink-0 ${
                  device.status === "ONLINE"
                    ? "bg-green-600/15 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-600/25"
                    : ""
                }`}
              >
                {device.status || "OFFLINE"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              <span className="hidden sm:inline">
                Firmware: {device.firmwareVersion || "N/A"} •{" "}
              </span>
              <span>
                Último sinal:{" "}
                {device.lastSeenAt
                  ? format(new Date(device.lastSeenAt), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })
                  : "N/A"}
              </span>
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0">
              <MoreVertical className="size-4 text-muted-foreground" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                toast.info("Funcionalidade de configuração em breve.")
              }
            >
              <Settings className="mr-2 size-4" /> Configurar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setIsDissociateDialogOpen(true)}
            >
              <Trash2 className="mr-2 size-4" /> Desvincular
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog de confirmação para desvincular */}
      <Dialog
        open={isDissociateDialogOpen}
        onOpenChange={setIsDissociateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desvincular Dispositivo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o dispositivo{" "}
              <strong>{device.serialNumber}</strong> desta planta?
              <br />
              <br />
              Ele voltará para o status "Disponível" e parará de coletar dados
              para esta unidade. O histórico de dados já coletado será mantido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDissociateDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDissociate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />{" "}
                  Desvinculando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
