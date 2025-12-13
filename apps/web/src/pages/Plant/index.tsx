import { usePlants } from "../../hooks/use-plants";
import { Building2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlantCard } from "@/components/plant/plant-card";

export default function PlantsPage() {
  const { data: plants, isLoading, error, refetch } = usePlants();

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
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full text-destructive">
          <AlertCircle className="size-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">Erro ao carregar plantas</h3>
          <p className="text-muted-foreground text-sm">
            Verifique sua conexão e tente novamente.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto bg-background/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="text-primary" />
            Plantas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus condomínios, indústrias ou residências.
          </p>
        </div>

        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 size-4" /> Nova Planta
        </Button>
      </div>

      {/* Lista Vazia */}
      {plants?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed border-border rounded-xl">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Building2 className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Nenhuma planta encontrada
          </h3>
          <p className="text-muted-foreground max-w-sm text-center mt-2">
            Você ainda não possui plantas cadastradas. Comece criando uma para
            vincular seus dispositivos.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plants?.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>
    </div>
  );
}
