import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  CalendarHeart,
  CloudOff,
  Package,
  PawPrint,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { PetAvatar } from "@/components/pet-avatar";
import { PetDialog } from "@/components/pet-dialog";
import { TutorDialog } from "@/components/tutor-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ESPECIE_META,
  STATUS_CORES,
  estoqueBaixo,
  formatAge,
  formatTime,
  todayISODate,
} from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia!";
  if (h < 18) return "Boa tarde!";
  return "Boa noite!";
}

export function HomeDashboard() {
  const { tutors, pets, agendamentos, produtos, tutorById, loading, error } = usePetCare();
  const [petOpen, setPetOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);

  const hoje = todayISODate();
  const agendamentosHoje = agendamentos
    .filter((a) => new Date(a.dataHora).toLocaleDateString("sv-SE") === hoje)
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora));

  const alertaEstoque = produtos.filter((p) => p.ativo && estoqueBaixo(p)).length;

  const petsRecentes = [...pets]
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, 5);

  const metrics = [
    {
      title: "Agendamentos de hoje",
      value: agendamentosHoje.length,
      icon: CalendarHeart,
      iconClass: "bg-primary/12 text-primary",
      to: "/agendamentos" as const,
    },
    {
      title: "Pacientes cadastrados",
      value: pets.length,
      icon: PawPrint,
      iconClass: "bg-pet-mint/15 text-pet-mint",
      to: "/pets" as const,
    },
    {
      title: "Tutores ativos",
      value: tutors.length,
      icon: Users,
      iconClass: "bg-pet-sky/15 text-pet-sky",
      to: "/tutores" as const,
    },
    {
      title: "Alerta de estoque baixo",
      value: alertaEstoque,
      icon: AlertTriangle,
      iconClass: alertaEstoque > 0
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : "bg-muted text-muted-foreground",
      to: "/estoque" as const,
    },
  ];

  const atalhos = [
    { label: "Novo Agendamento", desc: "Marcar consulta ou serviço", icon: CalendarDays, to: "/agendamentos" as const },
    { label: "Cadastrar Novo Pet", desc: "Adicionar um paciente", icon: PawPrint, action: () => setPetOpen(true) },
    { label: "Cadastrar Tutor", desc: "Novo responsável", icon: Users, action: () => setTutorOpen(true) },
    { label: "Novo Atendimento", desc: "Prontuário eletrônico", icon: Stethoscope, to: "/prontuarios" as const },
    { label: "Ajustar Estoque", desc: "Produtos e insumos", icon: Package, to: "/estoque" as const },
    { label: "Lançamento Financeiro", desc: "Receitas e despesas", icon: Wallet, to: "/financeiro" as const },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-3xl border border-primary/15 bg-primary/8 p-6 shadow-soft md:p-8">
        <h1 className="flex flex-wrap items-center gap-2.5 text-2xl font-extrabold tracking-tight md:text-3xl">
          {saudacao()} Que bom ter você aqui
          <PawPrint className="size-7 text-primary" />
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          Cuidando do bem-estar dos nossos pacientes com carinho e tranquilidade.
        </p>
      </section>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 shadow-soft">
          <CardContent className="flex items-start gap-3 p-4">
            <CloudOff className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-bold text-destructive">Falha ao conectar ao banco de dados</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-extrabold">Ações rápidas & atalhos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {atalhos.map((a) => {
            const inner = (
              <span className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <a.icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{a.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{a.desc}</span>
                </span>
              </span>
            );
            return a.to ? (
              <Link key={a.label} to={a.to} className="block">
                {inner}
              </Link>
            ) : (
              <button key={a.label} type="button" onClick={a.action} className="block w-full">
                {inner}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Link key={m.title} to={m.to}>
            <Card className="h-full shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground">
                  {m.title}
                </CardTitle>
                <span className={`flex size-9 items-center justify-center rounded-xl ${m.iconClass}`}>
                  <m.icon className="size-5" />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-extrabold tracking-tight">
                  {loading ? "…" : m.value}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-extrabold">Próximos atendimentos do dia</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/agendamentos">Ver agenda completa</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {agendamentosHoje.map((a) => {
            const meta = a.especie ? ESPECIE_META[a.especie] : null;
            const Icon = meta?.icon ?? PawPrint;
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3"
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${meta?.avatar ?? "bg-muted text-muted-foreground"}`}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {a.petNome ?? "Pet"}{" "}
                    <span className="font-normal text-muted-foreground">
                      • {a.especie ?? "—"}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatTime(a.dataHora)} • {a.veterinarioNome ?? "—"} • {a.servicoNome ?? "—"}
                  </p>
                </div>
                <Badge className={`border text-[11px] font-bold ${STATUS_CORES[a.status]}`}>
                  {a.status}
                </Badge>
              </div>
            );
          })}
          {!loading && agendamentosHoje.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum atendimento marcado para hoje. Aproveite para colocar os cadastros em dia 🐾
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-extrabold">Últimos pets cadastrados</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/pets">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {petsRecentes.map((pet) => {
            const tutor = tutorById(pet.tutorId);
            const meta = ESPECIE_META[pet.especie];
            return (
              <div
                key={pet.id}
                className="flex items-center gap-3 rounded-xl border bg-background p-3"
              >
                <PetAvatar pet={pet} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{pet.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatAge(pet.nascimento)} • Tutor: {pet.tutorNome ?? tutor?.nome ?? "—"}
                  </p>
                </div>
                <Badge className={`border-0 text-[11px] font-bold ${meta.chip}`}>
                  {pet.especie}
                </Badge>
              </div>
            );
          })}
          {petsRecentes.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground sm:col-span-2">
              Nenhum pet cadastrado ainda.
            </p>
          )}
        </CardContent>
      </Card>

      <PetDialog open={petOpen} onOpenChange={setPetOpen} />
      <TutorDialog open={tutorOpen} onOpenChange={setTutorOpen} />
    </div>
  );
}
