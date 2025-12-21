import { useState } from "react";
import { api } from "@/api/client";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddDeviceProps {
  plantId: string;
  onSuccess?: () => void;
}

export function AddDeviceForm({ plantId, onSuccess }: AddDeviceProps) {
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/devices/associate", {
        serialNumber,
        plantId,
      });

      toast.success("Dispositivo vinculado com sucesso!");
      setSerialNumber("");
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message ||
        "Falha ao vincular dispositivo. Verifique se o Serial Number está correto.";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="serialNumber">Número de Série (SN)</FieldLabel>
            <Input
              id="serialNumber"
              name="serialNumber"
              placeholder="Ex: SN-12345678"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              disabled={loading}
              required
            />
            <FieldDescription>
              Insira o identificador único impresso na etiqueta do medidor.
            </FieldDescription>
          </Field>

          {error && (
            <div className="text-sm text-destructive font-medium px-1 mt-2">
              {error}
            </div>
          )}

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                "Adicionar Dispositivo"
              )}
            </Button>
          </div>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
