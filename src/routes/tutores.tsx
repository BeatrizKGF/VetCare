import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { TutorDialog } from "@/components/tutor-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { normalizeSearch, type Tutor } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

export const Route = createFileRoute("/tutores")({
  head: () => ({
    meta: [
      { title: "Tutores — VetCare" },
      {
        name: "description",
        content:
          "Cadastre, busque, edite e exclua tutores de pets. Gestão completa de clientes da clínica veterinária.",
      },
      { property: "og:title", content: "Tutores — VetCare" },
      {
        property: "og:description",
        content: "Gestão completa de tutores: cadastro, busca por nome/CPF, edição e exclusão.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TutoresPage,
});

function TutoresPage() {
  const { tutors, petsByTutor, deleteTutor, loading } = usePetCare();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tutor | null>(null);
  const [deleting, setDeleting] = useState<Tutor | null>(null);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return tutors;
    const qDigits = search.replace(/\D/g, "");
    return tutors.filter((t) => {
      const nomeMatch = normalizeSearch(t.nome).includes(q);
      const cpfMatch = qDigits.length > 0 && t.cpf.replace(/\D/g, "").includes(qDigits);
      return nomeMatch || cpfMatch;
    });
  }, [tutors, search]);

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    const count = petsByTutor(deleting.id).length;
    try {
      await deleteTutor(deleting.id);
      toast.success(
        count > 0
          ? `Tutor "${deleting.nome}" e ${count} pet(s) vinculado(s) foram excluídos.`
          : `Tutor "${deleting.nome}" excluído com sucesso.`,
      );
      setDeleting(null);
    } catch {
      toast.error("Não foi possível excluir o tutor. Tente novamente.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Tutores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tutors.length} tutor(es) cadastrado(s) na clínica.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Novo Tutor
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">CPF</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                <TableHead className="hidden xl:table-cell">E-mail</TableHead>
                <TableHead className="text-center">Pets</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tutor) => {
                const petCount = petsByTutor(tutor.id).length;
                return (
                  <TableRow key={tutor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-xs font-extrabold text-secondary-foreground">
                          {tutor.nome
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{tutor.nome}</p>
                          <p className="truncate text-xs text-muted-foreground md:hidden">
                            {tutor.cpf}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{tutor.cpf}</TableCell>
                    <TableCell className="hidden lg:table-cell">{tutor.telefone}</TableCell>
                    <TableCell className="hidden xl:table-cell">{tutor.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-bold">
                        {petCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${tutor.nome}`}
                          onClick={() => {
                            setEditing(tutor);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir ${tutor.nome}`}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleting(tutor)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    Carregando tutores...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                        <Users className="size-6 text-muted-foreground" />
                      </span>
                      <p className="font-bold">Nenhum tutor encontrado</p>
                      <p className="text-sm text-muted-foreground">
                        {search
                          ? "Tente ajustar o termo de busca."
                          : "Clique em “Novo Tutor” para fazer o primeiro cadastro."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TutorDialog open={dialogOpen} onOpenChange={setDialogOpen} tutor={editing} />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir ${deleting?.nome ?? "tutor"}?`}
        description={
          deleting && petsByTutor(deleting.id).length > 0
            ? `Este tutor possui ${petsByTutor(deleting.id).length} pet(s) vinculado(s), que também serão excluídos. Esta ação não pode ser desfeita.`
            : "Esta ação não pode ser desfeita. O cadastro do tutor será removido permanentemente."
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
