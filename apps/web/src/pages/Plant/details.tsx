import { useParams, useNavigate } from "react-router";
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
  Trash2,
  Loader2,
  AlertTriangle,
  Save,
  Pencil,
  X,
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

import { PageLoading } from "@/components/feedbacks/page-loading";
import { PageError } from "@/components/feedbacks/page-error";
import { UnitCard } from "@/components/unit/unit-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddDeviceForm } from "@/components/forms/device/add-device-form";
import { useEffect, useState } from "react";
import {
  NewUnitForm,
  type OccupiedChannel,
} from "@/components/forms/unit/new-unit-form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useMutation } from "@tanstack/react-query";
import { UserRole } from "@/types";
import { api } from "@/api/client";
import { toast } from "sonner";
import { DeviceCard } from "@/components/devices/device-card";

export default function PlantDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: plant, isLoading, error, refetch } = usePlantDetails(id!);
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "" });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canManage =
    user &&
    plant &&
    (user.role === UserRole.ADMIN ||
      user.id === plant.ownerId ||
      user.id === plant.ownerId);

  useEffect(() => {
    if (plant) {
      setFormData({
        name: plant.name,
        address: plant.address || "",
      });
    }
  }, [plant]);

  const { mutate: updatePlant, isPending: isUpdating } = useMutation({
    mutationFn: async (data: typeof formData) => {
      await api.patch(`/plants/${id}`, data);
    },
    onSuccess: () => {
      toast.success("Planta atualizada com sucesso!");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar planta.");
    },
  });

  const { mutate: deletePlant, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await api.delete(`/plants/${id}`);
    },
    onSuccess: () => {
      toast.success("Planta excluída com sucesso.");
      navigate("/plants");
    },
    onError: (error: any) => {
      console.error(error);
      const msg = error.response?.data?.message || "Erro ao excluir planta.";
      toast.error(msg);
    },
  });

  const handleSave = () => {
    updatePlant(formData);
  };

  const handleCancel = () => {
    if (plant) {
      setFormData({ name: plant.name, address: plant.address || "" });
    }
    setIsEditing(false);
  };

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
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 md:mb-6 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" /> Voltar
            </button>
          </div>
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
                      <DeviceCard
                        key={device.id}
                        device={device}
                        onUpdate={refetch}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/20 border border-dashed rounded-lg px-4">
                    {/* ... (conteúdo de estado vazio mantido igual) ... */}
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
                      onClick={() => setIsDeviceDialogOpen(true)}
                    >
                      Adicionar Agora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {canManage && (
            <TabsContent
              value="settings"
              className="mt-6 animate-in fade-in duration-300 px-1 sm:px-0"
            >
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Configurações da Planta</CardTitle>
                    <CardDescription>
                      Gerencie dados cadastrais e o ciclo de vida da planta.
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="mr-2 size-4" /> Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isUpdating}
                      >
                        <X className="mr-2 size-4" /> Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 size-4" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      Nome da Planta
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={!isEditing || isUpdating}
                      placeholder="Ex: Condomínio Solar"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Endereço</label>
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      disabled={!isEditing || isUpdating}
                      placeholder="Endereço completo"
                    />
                  </div>

                  {/* Zona de Perigo */}
                  <div className="pt-6 mt-6 border-t border-red-100 dark:border-red-900/30">
                    <h4 className="text-sm font-semibold text-destructive mb-1 flex items-center gap-2">
                      <AlertTriangle className="size-4" /> Zona de Perigo
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ações irreversíveis que afetam toda a planta.
                    </p>

                    <Dialog
                      open={isDeleteDialogOpen}
                      onOpenChange={(open: boolean) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) setDeleteConfirmation("");
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="mr-2 size-4" /> Excluir Planta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Excluir Planta?</DialogTitle>
                          <DialogDescription>
                            Você está prestes a excluir{" "}
                            <strong>{plant.name}</strong>.
                            <br />
                            <br />
                            Isso removerá o acesso a todas as unidades e
                            histórico associado. Esta ação não pode ser
                            desfeita.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                          <label className="text-sm text-muted-foreground mb-2 block">
                            Para confirmar, digite{" "}
                            <span className="font-bold text-foreground select-all">
                              excluir
                            </span>{" "}
                            abaixo:
                          </label>
                          <Input
                            value={deleteConfirmation}
                            onChange={(e) =>
                              setDeleteConfirmation(e.target.value)
                            }
                            placeholder="excluir"
                            className="border-red-200 focus-visible:ring-red-500"
                            autoComplete="off"
                          />
                        </div>

                        <DialogFooter className="gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deletePlant()}
                            disabled={
                              isDeleting || deleteConfirmation !== "excluir"
                            }
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 size-4 animate-spin" />{" "}
                                Excluindo...
                              </>
                            ) : (
                              "Confirmar Exclusão"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
