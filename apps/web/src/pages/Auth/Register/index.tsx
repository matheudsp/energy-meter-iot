import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { api } from "../../../api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Zap, Loader2, AlertCircle } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "TENANT",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", formData);
      alert("Cadastro realizado com sucesso! Faça login.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="bg-primary p-2 rounded-lg text-primary-foreground">
              <Zap className="size-6 fill-current" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-card-foreground">
            Criar Nova Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nome Completo
              </label>
              <Input
                name="name"
                placeholder="João da Silva"
                onChange={handleChange}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                E-mail
              </label>
              <Input
                type="email"
                name="email"
                placeholder="joao@email.com"
                onChange={handleChange}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Senha
              </label>
              <Input
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                onChange={handleChange}
                required
                className="bg-background"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                <AlertCircle className="size-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2 size-4" />
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-border pt-4">
          <Link
            to="/login"
            className="text-sm text-primary hover:underline font-medium"
          >
            Voltar para Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
