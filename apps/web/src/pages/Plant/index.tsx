import { useState } from "react";
import { Building2, Plus, AlertCircle } from "lucide-react";

import { usePlants } from "@/hooks/use-plants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlantCard } from "@/components/plant/plant-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NewPlantForm } from "@/components/forms/plant/new-plant-form";

export default function PlantsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: plants, isLoading, error, refetch } = usePlants();

  const handlePlantCreated = () => {
    setIsDialogOpen(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center px-4">
        <div className="bg-destructive/10 p-4 rounded-full text-destructive">
          <AlertCircle className="size-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">Erro ao carregar plantas</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Não foi possível conectar ao servidor. Verifique sua conexão e tente
            novamente.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto bg-background/50">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="text-primary size-7 md:size-8" />
            Plantas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Gerencie seus condomínios, indústrias ou residências.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto shadow-sm">
              <Plus className="mr-2 size-4" /> Nova Planta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Planta</DialogTitle>
              <DialogDescription>
                Crie um novo local para agrupar e gerenciar suas unidades e
                medidores.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <NewPlantForm onSuccess={handlePlantCreated} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plants?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed border-border rounded-xl animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Building2 className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Nenhuma planta encontrada
          </h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2 text-sm">
            Você ainda não possui plantas cadastradas. Comece criando uma para
            vincular seus dispositivos e unidades.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setIsDialogOpen(true)}
          >
            Criar Primeira Planta
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {plants?.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>
    </div>
  );
}
