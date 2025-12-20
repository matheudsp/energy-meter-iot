import { useState, type SetStateAction } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Device {
  id: string;
  serialNumber: string;
}

export interface OccupiedChannel {
  deviceId: string;
  channelIndex: number;
}

interface NewUnitFormProps {
  plantId: string;
  devices: Device[];
  occupiedChannels?: OccupiedChannel[];
  onSuccess?: () => void;
}

export function NewUnitForm({
  plantId,
  devices,
  occupiedChannels = [],
  onSuccess,
}: NewUnitFormProps) {
  const [name, setName] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allChannels = Array.from({ length: 18 }, (_, i) => i + 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        name,
        plantId,
        deviceId: selectedDeviceId || undefined,
        channelIndex: selectedChannel ? parseInt(selectedChannel) : undefined,
      };

      await api.post("/units", payload);

      setName("");
      setSelectedDeviceId("");
      setSelectedChannel("");
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Falha ao criar unidade.");
    } finally {
      setLoading(false);
    }
  }

  const isChannelOccupied = (channelIndex: number) => {
    if (!selectedDeviceId) return false;
    return occupiedChannels.some(
      (oc) =>
        oc.deviceId === selectedDeviceId && oc.channelIndex === channelIndex
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nome da Unidade</FieldLabel>
            <Input
              id="name"
              placeholder="Ex: Apartamento 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
            <FieldDescription>
              Identificação amigável para o morador.
            </FieldDescription>
          </Field>

          {devices && devices.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Medidor</FieldLabel>
                <Select
                  value={selectedDeviceId}
                  onValueChange={(val: SetStateAction<string>) => {
                    setSelectedDeviceId(val);
                    setSelectedChannel("");
                  }}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Dispositivos Disponíveis</SelectLabel>
                      {devices.map((dev) => (
                        <SelectItem key={dev.id} value={dev.id}>
                          {dev.serialNumber}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Canal</FieldLabel>
                <Select
                  value={selectedChannel}
                  onValueChange={setSelectedChannel}
                  disabled={!selectedDeviceId || loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Canal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Canais Disponíveis</SelectLabel>
                      {allChannels.map((ch) => {
                        const isTaken = isChannelOccupied(ch);
                        return (
                          <SelectItem
                            key={ch}
                            value={ch.toString()}
                            disabled={isTaken}
                            className={isTaken ? "opacity-50" : ""}
                          >
                            Canal {ch} {isTaken ? "(Em uso)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

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
                  Criando...
                </>
              ) : (
                "Criar Unidade"
              )}
            </Button>
          </div>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
