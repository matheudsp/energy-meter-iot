import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageErrorProps {
  title?: string;
  message?: string;
  className?: string;
  // Opção A: Botão de ação (ex: refetch)
  onRetry?: () => void;
  retryLabel?: string;
  // Opção B: Link de voltar
  backLink?: string;
  backLabel?: string;
}

export function PageError({
  title = "Falha ao carregar",
  message = "Ocorreu um erro ao conectar com o servidor.",
  className,
  onRetry,
  retryLabel = "Tentar novamente",
  backLink,
  backLabel = "Voltar ao início",
}: PageErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4 animate-in zoom-in-95 duration-300",
        className
      )}
    >
      <div className="bg-destructive/10 p-4 rounded-full text-destructive mb-2">
        <AlertCircle className="size-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>

      <div className="flex gap-2 mt-2">
        {backLink && (
          <Link to={backLink}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft size={16} /> {backLabel}
            </Button>
          </Link>
        )}

        {onRetry && (
          <Button
            onClick={onRetry}
            variant={backLink ? "default" : "outline"}
            className="gap-2"
          >
            <RefreshCw size={16} /> {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
