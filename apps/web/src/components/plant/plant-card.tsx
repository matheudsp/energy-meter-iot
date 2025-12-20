import { Link } from "react-router";
import { ArrowRight, MapPin, Box, Cpu, User, Building2 } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import type { Plant } from "@/types";

interface PlantCardProps {
  plant: Plant;
}

export function PlantCard({ plant }: PlantCardProps) {
  return (
    <Link to={`/plants/${plant.id}`}>
      <Card className="min-w-[260px] hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer group h-full bg-card border-border">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base group-hover:text-primary transition-colors flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                {plant.name}
              </CardTitle>
              {/* <CardDescription className="flex items-center gap-1">
                ID: {plant.id}
              </CardDescription> */}
            </div>

            <ArrowRight className="size-5 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5">
          <div className="flex items-start text-sm text-muted-foreground gap-2 mb-4">
            <MapPin className="size-4 shrink-0 mt-0.5" />
            <span className="truncate leading-tight">
              {plant.address || "Endereço não informado"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-0.5">
                <Box className="size-3.5" /> Unidades
              </span>
              <span className="text-lg font-semibold text-foreground pl-5">
                {plant.units?.length || 0}
              </span>
            </div>

            <div className="flex flex-col border-l border-border/50 pl-4">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-0.5">
                <Cpu className="size-3.5" /> Dispositivos
              </span>
              <span className="text-lg font-semibold text-foreground pl-5">
                {plant.devices?.length || 0}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="py-0">
          <div className="flex items-center text-xs text-muted-foreground gap-1.5 bg-muted/30 px-2 py-1 rounded-md w-full">
            <User className="size-3" />
            <span className="truncate">
              Proprietário:{" "}
              <span className="font-medium text-foreground/80">
                {plant.owner?.name || "N/A"}
              </span>
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
