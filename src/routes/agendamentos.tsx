import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Calendar, Clock, FileText, PawPrint, Pencil, Plus, Search, Stethoscope, Trash2, User } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AgendamentoDialog } from "@/components/agendamento-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { ProntuarioDialog } from "@/components/prontuario-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  STATUS_CORES, formatCurrency, formatDate, formatTime, normalizeSearch,
  type Agendamento, type StatusAgendamento,
} from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

export const Route = createFileRoute("/agendamentos")({
  head: () => ({
    meta: [
      { title: "Agendamentos — VetCare" },
      { name: "description", content: "Gerencie os agendamentos da clínica veterinária." },
      { property: "og:title", content: "Agendamentos — VetCare" },
      { property: "og:description", content: "Grade de agendamentos da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgendamentosPage,
});

function groupByDate(agendamentos: Agendamento[]): Record<string, Agendamento[]> {
  const groups: Record<string, Agendamento[]> = {};
  for (const a of agendamentos) {
    const key = a.dataHora.slice(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return groups;
}

function AgendamentosPage() {
  const { agendamentos, updateAgendamento, deleteAgendamento, loading } = usePetCare();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agendamento | null>(null);
  const [deleting, setDeleting] = useState<Agendamento | null>(null);
  const [atendendo, setAtendendo] = useState<Agendamento | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const filtered = useMemo(() => {
    let list = agendamentos;
    if (statusFilter !== "todos") list = list.filter((a) => a.status === statusFilter);
    const q = normalizeSearch(search.trim());
    if (q) {
      list = list.filter(
        (a) =>
          normalizeSearch(a.petNome ?? "").includes(q) ||
          normalizeSearch(a.tutorNome ?? "").includes(q) ||
          normalizeSearch(a.veterinarioNome ?? "").includes(q) ||
          normalizeSearch(a.servicoNome ?? "").includes(q),
      );
    }
    return list;
  }, [agendamentos, search, statusFilter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const sortedDates = Object.keys(grouped).sort();

  const handleStatusChange = async (a: Agendamento, newStatus: StatusAgendamento) => {
    try {
      await updateAgendamento(a.id, {
        petId: a.petId, veterinarioId: a.veterinarioId, servicoId: a.servicoId,
        dataHora: a.dataHora, status: newStatus, observacoes: a.observacoes,
      });
      toast.success(`Status alterado para "${newStatus}".`);
    } catch {
      toast.error("Não foi possível alterar o status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAgendamento(deleting.id);
      toast.success("Agendamento excluído com sucesso.");
      setDeleting(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível excluir o agendamento.",
      );
    }
  };


  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Agendamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {agendamentos.length} agendamento(s) no total.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="size-4" /> Novo Agendamento
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por pet, tutor, veterinário ou serviço..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.keys(STATUS_CORES).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="shadow-soft">
              <CardHeader><div className="h-5 w-40 animate-pulse rounded bg-muted" /></CardHeader>
              <CardContent><div className="h-20 animate-pulse rounded bg-muted" /></CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && sortedDates.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Calendar className="size-7 text-muted-foreground" />
            </span>
            <p className="text-lg font-bold">Nenhum agendamento encontrado</p>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== "todos"
                ? "Tente ajustar os filtros de busca."
                : "Clique em \"Novo Agendamento\" para agendar o primeiro atendimento."}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Calendar className="size-4" />
            {formatDate(dateKey + "T00:00:00")}
          </h2>
          <div className="space-y-3">
            {(grouped[dateKey] ?? []).map((a) => (
              <Card key={a.id} className="shadow-soft transition-shadow hover:shadow-lift">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 sm:w-28 shrink-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <p className="text-lg font-extrabold leading-tight">{formatTime(a.dataHora)}</p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 font-bold">
                        <PawPrint className="size-3.5 text-pet-mint" />
                        {a.petNome ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({a.especie ?? "—"})
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="size-3" /> {a.tutorNome ?? "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {a.veterinarioNome ? (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="size-3.5" /> {a.veterinarioNome}
                        </span>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-[11px] font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                        >
                          <AlertTriangle className="mr-1 size-3" /> Sem veterinário — reatribua
                        </Badge>
                      )}
                      <span>{a.servicoNome ?? "—"} — {formatCurrency(a.servicoPreco ?? 0)}</span>
                    </div>
                    {a.observacoes && (
                      <p className="text-xs italic text-muted-foreground">"{a.observacoes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <Select value={a.status} onValueChange={(v) => handleStatusChange(a, v as StatusAgendamento)}>
                      <SelectTrigger className={`h-7 w-[140px] text-xs font-bold border ${STATUS_CORES[a.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(STATUS_CORES).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      {(a.status === "Em Atendimento" || a.status === "Concluído") && (
                        <Button variant="secondary" size="sm" onClick={() => setAtendendo(a)}>
                          <FileText className="size-4" />
                          {a.status === "Concluído" ? "Ver atendimento" : "Atender"}
                        </Button>
                      )}

                      <Button variant="ghost" size="icon" aria-label="Editar agendamento"
                        onClick={() => { setEditing(a); setDialogOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Excluir agendamento"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleting(a)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <AgendamentoDialog open={dialogOpen} onOpenChange={setDialogOpen} agendamento={editing} />

      <ProntuarioDialog
        open={Boolean(atendendo)}
        onOpenChange={(open) => !open && setAtendendo(null)}
        defaultPetId={atendendo?.petId}
        defaultVeterinarioId={atendendo?.veterinarioId}
        defaultAgendamentoId={atendendo?.id}
        loadExisting
        initialReadOnly={atendendo?.status === "Concluído"}
      />


      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir agendamento?"
        description={`Deseja realmente excluir o agendamento de ${deleting?.petNome ?? "este pet"} em ${deleting ? formatDate(deleting.dataHora) : ""}? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
