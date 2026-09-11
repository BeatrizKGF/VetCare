import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Stethoscope, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { VeterinarioDialog } from "@/components/veterinario-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { normalizeSearch, type Veterinario } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

export const Route = createFileRoute("/veterinarios")({
  head: () => ({
    meta: [
      { title: "Veterinários — VetCare" },
      { name: "description", content: "Gerencie a equipe de veterinários da clínica." },
      { property: "og:title", content: "Veterinários — VetCare" },
      { property: "og:description", content: "Gestão da equipe veterinária." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VeterinariosPage,
});

function VeterinariosPage() {
  const { veterinarios, deleteVeterinario, updateVeterinario, loading } = usePetCare();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Veterinario | null>(null);
  const [deleting, setDeleting] = useState<Veterinario | null>(null);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return veterinarios;
    return veterinarios.filter(
      (v) => normalizeSearch(v.nome).includes(q) || normalizeSearch(v.crmv).includes(q) || normalizeSearch(v.especialidade).includes(q),
    );
  }, [veterinarios, search]);

  const handleToggleAtivo = async (vet: Veterinario) => {
    try {
      await updateVeterinario(vet.id, { ...vet, ativo: !vet.ativo });
      toast.success(vet.ativo ? `"${vet.nome}" desativado.` : `"${vet.nome}" reativado.`);
    } catch {
      toast.error("Não foi possível alterar o status do veterinário.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteVeterinario(deleting.id);
      toast.success(`Veterinário "${deleting.nome}" excluído com sucesso.`);
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir o veterinário.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Veterinários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {veterinarios.length} veterinário(s) cadastrado(s).
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="size-4" /> Novo Veterinário
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome, CRMV ou especialidade..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">CRMV</TableHead>
                <TableHead className="hidden lg:table-cell">Especialidade</TableHead>
                <TableHead className="hidden xl:table-cell">Telefone</TableHead>
                <TableHead className="hidden xl:table-cell">E-mail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vet) => (
                <TableRow key={vet.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-xs font-extrabold text-secondary-foreground">
                        {vet.nome.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{vet.nome}</p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">{vet.crmv}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{vet.crmv}</TableCell>
                  <TableCell className="hidden lg:table-cell">{vet.especialidade}</TableCell>
                  <TableCell className="hidden xl:table-cell">{vet.telefone}</TableCell>
                  <TableCell className="hidden xl:table-cell">{vet.email}</TableCell>
                  <TableCell>
                    <Badge variant={vet.ativo ? "default" : "secondary"}
                      className={vet.ativo ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" : ""}>
                      {vet.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Editar ${vet.nome}`}
                        onClick={() => { setEditing(vet); setDialogOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Excluir ${vet.nome}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleting(vet)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    Carregando veterinários...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                        <Stethoscope className="size-6 text-muted-foreground" />
                      </span>
                      <p className="font-bold">Nenhum veterinário encontrado</p>
                      <p className="text-sm text-muted-foreground">
                        {search ? "Tente ajustar o termo de busca." : "Clique em \"Novo Veterinário\" para fazer o primeiro cadastro."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <VeterinarioDialog open={dialogOpen} onOpenChange={setDialogOpen} veterinario={editing} />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir ${deleting?.nome ?? "veterinário"}?`}
        description="Esta ação não pode ser desfeita. O histórico clínico (prontuários e vacinas) continuará registrado no nome dele, e os agendamentos vinculados ficarão sem veterinário."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
