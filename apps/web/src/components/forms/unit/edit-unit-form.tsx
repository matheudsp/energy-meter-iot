import { useState } from "react";
import { api } from "@/api/client";
import { AxiosError } from "axios";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
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
import type { Unit } from "@/types";

interface Device {
  id: string;
  serialNumber: string;
}

export interface OccupiedChannel {
  deviceId: string;
  channelIndex: number;
}

interface EditUnitFormProps {
  unit: Unit;
  devices: Device[];
  occupiedChannels?: OccupiedChannel[];
  onSuccess?: () => void;
}

export function EditUnitForm({
  unit,
  devices,
  occupiedChannels = [],
  onSuccess,
}: EditUnitFormProps) {
  const currentMap = unit.channelMaps?.[0];

  const [name, setName] = useState(unit.name);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    currentMap?.deviceId || ""
  );
  const [selectedChannel, setSelectedChannel] = useState<string>(
    currentMap?.channelIndex?.toString() || ""
  );
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
        deviceId: selectedDeviceId || undefined,
        channelIndex: selectedChannel ? parseInt(selectedChannel) : undefined,
      };

      await api.patch(`/units/${unit.id}`, payload);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      if (err instanceof AxiosError && err.response?.data) {
        setError(err.response.data.message || "Falha ao atualizar unidade.");
      } else {
        setError("Ocorreu um erro inesperado.");
      }
    } finally {
      setLoading(false);
    }
  }

  const isChannelOccupied = (channelIndex: number) => {
    if (!selectedDeviceId) return false;

    return occupiedChannels.some(
      (oc) =>
        oc.deviceId === selectedDeviceId &&
        oc.channelIndex === channelIndex &&
        !(
          selectedDeviceId === currentMap?.deviceId &&
          channelIndex === currentMap?.channelIndex
        )
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="edit-name">Nome da Unidade</FieldLabel>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Medidor</FieldLabel>
              <Select
                value={selectedDeviceId}
                onValueChange={(val: string) => {
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
                    <SelectLabel>Dispositivos</SelectLabel>
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
                    <SelectLabel>Canais</SelectLabel>
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

          {error && (
            <div className="text-sm text-destructive font-medium px-1 mt-2">
              {error}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
