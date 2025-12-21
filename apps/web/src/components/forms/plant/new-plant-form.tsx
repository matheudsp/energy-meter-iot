import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/api/client";

interface NewPlantFormProps {
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  address?: string;
}

export function NewPlantForm({ onSuccess }: NewPlantFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "O nome da planta é obrigatório.";
      isValid = false;
    } else if (formData.name.length < 3) {
      newErrors.name = "O nome deve ter pelo menos 3 caracteres.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/plants", formData);

      toast.success("Planta criada com sucesso!");

      setFormData({ name: "", address: "" });
      setErrors({});

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Erro ao criar planta.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>
          Nome da Planta <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex: Condomínio Solar Vista Alegre"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          disabled={isLoading}
          className={
            errors.name
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }
        />
        {errors.name && (
          <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço (Opcional)</Label>
        <Input
          id="address"
          placeholder="Ex: Rua das Flores, 123 - Centro"
          value={formData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Criando...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" /> Criar Planta
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
