import { useParams, Link } from "react-router";
import { usePlantDetails } from "@/hooks/use-plant-details";
import {
  ArrowLeft,
  MapPin,
  User,
  Box,
  Cpu,
  Settings,
  Building2,
  Plus,
  MoreVertical,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageLoading } from "@/components/feedbacks/page-loading";
import { PageError } from "@/components/feedbacks/page-error";
import { UnitCard } from "@/components/unit/unit-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddDeviceForm } from "@/components/forms/device/add-device-form";
import { useState } from "react";
import {
  NewUnitForm,
  type OccupiedChannel,
} from "@/components/forms/unit/new-unit-form";
export default function PlantDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: plant, isLoading, error, refetch } = usePlantDetails(id!);
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  if (isLoading)
    return <PageLoading message="Carregando informações da planta..." />;
  if (error)
    return (
      <PageError
        message="Não foi possível carregar os detalhes desta planta."
        backLink="/plants"
        backLabel="Voltar para Plantas"
      />
    );
  if (!plant) return null;

  const occupiedChannels: OccupiedChannel[] =
    plant?.units?.flatMap(
      (unit: any) =>
        unit.channelMaps?.map((map: any) => ({
          deviceId: map.deviceId,
          channelIndex: map.channelIndex,
        })) || []
    ) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 mx-auto">
          <Link
            to="/plants"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 md:mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Link>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="size-16 md:size-24 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <Building2 className="size-8 md:size-12 text-primary" />
            </div>

            <div className="flex-1 space-y-2 w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                  {plant.name}
                </h1>
                <Badge variant="outline" className="w-fit shrink-0">
                  ID: {plant.id}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="size-4 shrink-0" />
                  <span className="truncate">
                    {plant.address || "Endereço não informado"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="size-4 shrink-0" />
                  <span className="truncate">
                    {plant.owner?.name || "Sem proprietário"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-0">
              <Dialog
                open={isUnitDialogOpen}
                onOpenChange={setIsUnitDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 size-4" /> Nova Unidade
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Unidade</DialogTitle>
                    <DialogDescription>
                      Crie uma nova unidade. Canais já utilizados ficarão
                      indisponíveis.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <NewUnitForm
                      plantId={plant.id}
                      devices={plant.devices || []}
                      occupiedChannels={occupiedChannels}
                      onSuccess={() => {
                        setIsUnitDialogOpen(false);
                        refetch();
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:gap-8 mt-6 md:mt-8 pt-6 border-t border-border">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {plant.units?.length || 0}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                Unidades
              </span>
            </div>
            <div className="flex flex-col border-l border-border pl-4 sm:border-0 sm:pl-0">
              <span className="text-2xl font-bold text-foreground">
                {plant.devices?.length || 0}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                Dispositivos
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 ">
        <Tabs defaultValue="units" className="w-full">
          <div className="w-full overflow-x-auto pb-px">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-x border-border rounded-none  min-w-max">
              <TabsTrigger
                value="units"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 data-[state=active]:shadow-none hover:text-foreground transition-colors"
              >
                <Box className="mr-2 size-4" />
                Unidades
              </TabsTrigger>
              <TabsTrigger
                value="devices"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 data-[state=active]:shadow-none hover:text-foreground transition-colors"
              >
                <Cpu className="mr-2 size-4" />
                Dispositivos
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-none border-b-2  border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 data-[state=active]:shadow-none hover:text-foreground transition-colors"
              >
                <Settings className="mr-2 size-4" />
                Configurações
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="units"
            className="mt-6 space-y-4 animate-in fade-in duration-300 px-4 sm:px-0"
          >
            {plant.units && plant.units.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
                {plant.units.map((unit: any) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    devices={plant.devices || []}
                    occupiedChannels={occupiedChannels}
                    onUpdate={refetch}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <Box className="size-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium text-lg">
                  Nenhuma unidade cadastrada
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Adicione unidades para começar a monitorar.
                </p>
                <Button variant="outline" className="mt-4">
                  Adicionar Unidade
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="devices"
            className="mt-6 animate-in fade-in duration-300 px-4 sm:px-0"
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>Dispositivos Vinculados</CardTitle>
                    <CardDescription>
                      Gerencie os medidores instalados nesta planta.
                    </CardDescription>
                  </div>
                  <Dialog
                    open={isDeviceDialogOpen}
                    onOpenChange={setIsDeviceDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="w-full sm:w-auto">
                        <Plus className="mr-2 size-4" /> Novo Dispositivo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Dispositivo</DialogTitle>
                        <DialogDescription>
                          Vincule um medidor existente a esta planta informando
                          seu número de série.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="mt-4">
                        <AddDeviceForm
                          plantId={plant.id}
                          onSuccess={() => {
                            setIsDeviceDialogOpen(false);
                            refetch();
                          }}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {plant.devices && plant.devices.length > 0 ? (
                  <div className="divide-y divide-border rounded-md border border-border">
                    {plant.devices.map((device: any) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                          <div className="bg-muted p-2.5 rounded-full shrink-0">
                            <Cpu className="size-5 text-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {device.serialNumber}
                              </p>
                              <Badge
                                variant={
                                  device.status === "ONLINE"
                                    ? "default"
                                    : "secondary"
                                }
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
                                  ? new Date(device.lastSeenAt).toLocaleString()
                                  : "N/A"}
                              </span>
                            </p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0"
                            >
                              <MoreVertical className="size-4 text-muted-foreground" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Settings className="mr-2 size-4" /> Configurar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 size-4" /> Desvincular
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/20 border border-dashed rounded-lg px-4">
                    <Cpu className="size-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      Nenhum dispositivo vinculado
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
                      Adicione um medidor IoT para começar a coletar dados.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Adicionar Agora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="settings"
            className="mt-6 animate-in fade-in duration-300 px-4 sm:px-0"
          >
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Planta</CardTitle>
                <CardDescription>
                  Gerencie dados cadastrais e permissões.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nome da Planta</label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    value={plant.name}
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Endereço</label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    value={plant.address || ""}
                    disabled
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-destructive mb-2">
                    Zona de Perigo
                  </h4>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Excluir Planta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
