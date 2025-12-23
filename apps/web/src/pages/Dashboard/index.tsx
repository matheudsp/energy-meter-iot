import { useAuth } from "@/context/auth-context";
import { usePlants } from "@/hooks/use-plants";
import { useDashboardOverview } from "@/hooks/use-dashboard";
import { Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageError } from "@/components/feedbacks/page-error";
import { DashboardAdminView } from "./views/dashboard-admin-view";
import { DashboardTenantView } from "./views/dashboard-tenant-view";

export default function Dashboard() {
  const { user } = useAuth();

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardOverview();
  const isTenant = user?.role === "TENANT";
  const {
    data: plants,
    isLoading: isPlantsLoading,
    refetch: refetchPlants,
  } = usePlants({ enabled: !isTenant });

  const handleRefresh = () => {
    refetchDashboard();
    if (!isTenant) {
      refetchPlants();
    }
  };

  if (dashboardError) {
    return (
      <PageError
        title="Erro de Conexão"
        message="Não conseguimos carregar os dados do dashboard em tempo real."
        onRetry={handleRefresh}
        backLabel="Tentar novamente"
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-background/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="text-primary fill-primary size-6 md:size-8" />
            EnergyMeter
            <span className="text-muted-foreground font-normal text-lg md:text-xl hidden sm:inline-block border-l border-border pl-3 ml-1">
              Visão Geral
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {isTenant
              ? "Acompanhe o consumo das suas unidades em tempo real."
              : "Monitoramento inteligente de consumo e eficiência energética."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="gap-2 w-full sm:w-auto shadow-sm"
        >
          <RefreshCw className="size-4" /> Atualizar
        </Button>
      </div>

      {isTenant ? (
        <DashboardTenantView
          data={dashboardData}
          isLoading={isDashboardLoading}
          onRefresh={handleRefresh}
        />
      ) : (
        <DashboardAdminView
          data={dashboardData}
          isLoading={isDashboardLoading}
          plants={plants || []}
          isPlantsLoading={isPlantsLoading}
        />
      )}
    </div>
  );
}
