import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({
  message = "Carregando dados...",
  className,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        "min-h-[60vh] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500",
        className
      )}
    >
      <Loader2 className="animate-spin text-primary size-10 mb-4" />
      <span className="text-muted-foreground font-medium text-sm">
        {message}
      </span>
    </div>
  );
}
