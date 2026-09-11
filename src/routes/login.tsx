import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, PawPrint } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — VetCare" },
      {
        name: "description",
        content:
          "Acesse o VetCare, o sistema de gestão para clínicas veterinárias e petshops, com seu e-mail e senha.",
      },
      { property: "og:title", content: "Entrar — VetCare" },
      {
        property: "og:description",
        content: "Faça login para gerenciar agendamentos, pets, tutores e o financeiro da clínica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) void navigate({ to: "/home", replace: true });
  }, [ready, user, navigate]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-primary/15 via-background to-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <PawPrint className="size-7" />
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">VetCare</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Gestão para clínicas veterinárias e petshops
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base font-extrabold">Bem-vindo de volta</CardTitle>
            <CardDescription>Entre com suas credenciais para acessar o sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  await signIn(email, senha);
                  toast.success("Login realizado com sucesso!");
                  await navigate({ to: "/home", replace: true });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Não foi possível entrar.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="voce@vetcare.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-senha">Senha</Label>
                <Input
                  id="login-senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                Entrar no Sistema
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
