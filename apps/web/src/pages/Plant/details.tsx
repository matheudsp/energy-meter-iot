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

export default function PlantDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: plant, isLoading, error } = usePlantDetails(id!);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-8 mx-auto border-b border-border bg-card">
        <div className=" ">
          <Link
            to="/plants"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="size-24 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <Building2 className="size-12 text-primary" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {plant.name}
                </h1>
                <Badge variant="outline" className="w-fit">
                  ID: {plant.id}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {plant.address || "Endereço não informado"}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="size-4" />
                  {plant.owner?.name || "Sem proprietário"}
                </div>
              </div>
            </div>

            {/* <div className="flex gap-3">
              <Button variant="outline">Editar</Button>
            </div> */}
          </div>

          <div className="flex gap-8 mt-8 pt-6 border-t border-border">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {plant.units?.length || 0}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                Unidades
              </span>
            </div>
            <div className="flex flex-col">
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

      <div className="max-w-7xl mx-auto ">
        <Tabs defaultValue="units" className="w-full">
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none space-x-6">
            <TabsTrigger
              value="units"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none"
            >
              <Box className="mr-2 size-4" />
              Unidades
            </TabsTrigger>
            <TabsTrigger
              value="devices"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none"
            >
              <Cpu className="mr-2 size-4" />
              Dispositivos
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:shadow-none"
            >
              <Settings className="mr-2 size-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="mt-6 space-y-4">
            {plant.units && plant.units.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plant.units.map((unit: any) => (
                  <UnitCard key={unit.id} unit={unit} />
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

          <TabsContent value="devices" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>Dispositivos Vinculados</CardTitle>
                    <CardDescription>
                      Gerencie os medidores instalados nesta planta.
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="mr-2 size-4" /> Novo Dispositivo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {plant.devices && plant.devices.length > 0 ? (
                  <div className="divide-y divide-border rounded-md border border-border">
                    {plant.devices.map((device: any) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-muted p-2.5 rounded-full">
                            <Cpu className="size-5 text-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {device.serialNumber}
                              </p>
                              <Badge
                                variant={
                                  device.status === "ONLINE"
                                    ? "default"
                                    : "secondary"
                                }
                                className={`text-[10px] px-1.5 py-0 ${
                                  device.status === "ONLINE"
                                    ? "bg-green-600/15 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-600/25"
                                    : ""
                                }`}
                              >
                                {device.status || "OFFLINE"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Firmware: {device.firmwareVersion || "N/A"} •{" "}
                              <span className="inline-block">
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
                              className="size-8"
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
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/20 border border-dashed rounded-lg">
                    <Cpu className="size-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      Nenhum dispositivo vinculado
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1 mb-4">
                      Adicione um medidor IoT para começar a coletar dados.
                    </p>
                    <Button variant="outline" size="sm">
                      Adicionar Agora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
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
                  <Button variant="destructive" size="sm">
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
