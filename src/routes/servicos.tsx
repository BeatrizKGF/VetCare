import { createFileRoute } from "@tanstack/react-router";
import { Clock, Pencil, Plus, Search, Scissors, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { ServicoDialog } from "@/components/servico-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, normalizeSearch, type Servico } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — VetCare" },
      { name: "description", content: "Gerencie os serviços oferecidos pela clínica veterinária." },
      { property: "og:title", content: "Serviços — VetCare" },
      { property: "og:description", content: "Gestão de serviços da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicosPage,
});

function ServicosPage() {
  const { servicos, deleteServico, updateServico, loading } = usePetCare();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);
  const [deleting, setDeleting] = useState<Servico | null>(null);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return servicos;
    return servicos.filter(
      (s) => normalizeSearch(s.nome).includes(q) || normalizeSearch(s.descricao).includes(q),
    );
  }, [servicos, search]);

  const handleToggleAtivo = async (s: Servico) => {
    try {
      await updateServico(s.id, { ...s, ativo: !s.ativo });
      toast.success(s.ativo ? `"${s.nome}" desativado.` : `"${s.nome}" reativado.`);
    } catch {
      toast.error("Não foi possível alterar o status do serviço.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteServico(deleting.id);
      toast.success(`Serviço "${deleting.nome}" excluído com sucesso.`);
      setDeleting(null);
    } catch {
      toast.error("Não foi possível excluir o serviço. Verifique se há agendamentos vinculados.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Serviços</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {servicos.length} serviço(s) cadastrado(s).
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="size-4" /> Novo Serviço
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar serviço..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-soft">
              <CardContent className="p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <Scissors className="size-7 text-muted-foreground" />
            </span>
            <p className="text-lg font-bold">Nenhum serviço encontrado</p>
            <p className="text-sm text-muted-foreground">
              {search ? "Tente ajustar o termo de busca." : "Clique em \"Novo Serviço\" para fazer o primeiro cadastro."}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="shadow-soft transition-shadow hover:shadow-lift">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold">{s.nome}</p>
                    <p className="mt-0.5 text-lg font-extrabold text-primary">{formatCurrency(s.preco)}</p>
                  </div>
                  <Badge variant={s.ativo ? "default" : "secondary"}
                    className={s.ativo ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" : ""}>
                    {s.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {s.descricao && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{s.descricao}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>{s.duracaoMinutos} min</span>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="outline" size="sm" className="flex-1"
                    onClick={() => { setEditing(s); setDialogOpen(true); }}>
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={() => handleToggleAtivo(s)}>
                    {s.ativo ? "Desativar" : "Reativar"}
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleting(s)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServicoDialog open={dialogOpen} onOpenChange={setDialogOpen} servico={editing} />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir ${deleting?.nome ?? "serviço"}?`}
        description="Esta ação não pode ser desfeita. Agendamentos vinculados a este serviço podem ser afetados."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
