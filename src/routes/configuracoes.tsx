import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Building2, Info, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UsuariosSection } from "@/components/usuarios-section";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — VetCare" },
      {
        name: "description",
        content:
          "Configure os dados da clínica e as preferências de notificação do VetCare.",
      },
      { property: "og:title", content: "Configurações — VetCare" },
      {
        property: "og:description",
        content: "Dados da clínica e preferências de notificação do sistema VetCare.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [clinica, setClinica] = useState({
    nome: "VetCare Clínica Veterinária",
    telefone: "(11) 3456-7890",
    email: "contato@petcare.vet.br",
    endereco: "Av. dos Bichos, 456 - Jardins, São Paulo/SP",
  });
  const [prefs, setPrefs] = useState({
    lembretesVacina: true,
    confirmacaoWhatsapp: true,
    resumoSemanal: false,
  });

  const prefItems = [
    {
      key: "lembretesVacina" as const,
      title: "Lembretes de vacina",
      description: "Notificar tutores sobre vacinas próximas do vencimento.",
    },
    {
      key: "confirmacaoWhatsapp" as const,
      title: "Confirmação por WhatsApp",
      description: "Enviar confirmação de agendamento pelo WhatsApp do tutor.",
    },
    {
      key: "resumoSemanal" as const,
      title: "Resumo semanal por e-mail",
      description: "Receber um resumo de atendimentos e novos cadastros toda segunda-feira.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dados da clínica e preferências do sistema.
        </p>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-extrabold">
            <Building2 className="size-4 text-primary" /> Dados da clínica
          </CardTitle>
          <CardDescription>
            Essas informações aparecem em recibos, lembretes e comunicações com os tutores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Dados da clínica salvos com sucesso.");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="cfg-nome">Nome da clínica</Label>
              <Input
                id="cfg-nome"
                value={clinica.nome}
                onChange={(e) => setClinica((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cfg-tel">Telefone</Label>
                <Input
                  id="cfg-tel"
                  value={clinica.telefone}
                  onChange={(e) => setClinica((p) => ({ ...p, telefone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfg-email">E-mail</Label>
                <Input
                  id="cfg-email"
                  type="email"
                  value={clinica.email}
                  onChange={(e) => setClinica((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfg-end">Endereço</Label>
              <Input
                id="cfg-end"
                value={clinica.endereco}
                onChange={(e) => setClinica((p) => ({ ...p, endereco: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">
                <Save className="size-4" /> Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-extrabold">
            <BellRing className="size-4 text-primary" /> Notificações
          </CardTitle>
          <CardDescription>Escolha quais comunicações automáticas ficam ativas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {prefItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60"
            >
              <div>
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={prefs[item.key]}
                onCheckedChange={(checked) => {
                  setPrefs((p) => ({ ...p, [item.key]: checked }));
                  toast.success(
                    `${item.title} ${checked ? "ativado" : "desativado"}.`,
                  );
                }}
                aria-label={item.title}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <UsuariosSection />

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-extrabold">
            <Info className="size-4 text-primary" /> Sobre o VetCare
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-bold text-foreground">Versão:</span> 1.0.0 (demonstração)
          </p>
          <p>
            <span className="font-bold text-foreground">Dados:</span> os cadastros desta versão
            são simulados e ficam apenas em memória — ao recarregar a página, os dados de
            exemplo são restaurados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
