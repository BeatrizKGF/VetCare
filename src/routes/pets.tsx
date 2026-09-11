import { createFileRoute } from "@tanstack/react-router";
import { Cake, FileText, Pencil, PawPrint, Plus, Search, Stethoscope, Trash2, User } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { PetAvatar } from "@/components/pet-avatar";
import { PetDialog } from "@/components/pet-dialog";
import { ProntuarioPetDialog } from "@/components/prontuario-pet-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ESPECIE_META, SEXO_LABEL, formatAge, normalizeSearch, type Pet } from "@/lib/petcare";
import { usePetCare } from "@/lib/petcare-store";

export const Route = createFileRoute("/pets")({
  head: () => ({
    meta: [
      { title: "Pets — VetCare" },
      {
        name: "description",
        content:
          "Cadastre e gerencie os pets da clínica: espécie, raça, porte, idade, tutor responsável e observações médicas.",
      },
      { property: "og:title", content: "Pets — VetCare" },
      {
        property: "og:description",
        content: "Gestão completa de pets vinculados aos tutores, com busca rápida e cards visuais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PetsPage,
});

function PetsPage() {
  const { pets, tutors, tutorById, deletePet, loading } = usePetCare();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [deleting, setDeleting] = useState<Pet | null>(null);
  const [prontuarioPet, setProntuarioPet] = useState<Pet | null>(null);

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return pets;
    return pets.filter((p) => {
      const tutor = tutorById(p.tutorId);
      return (
        normalizeSearch(p.nome).includes(q) ||
        (tutor ? normalizeSearch(tutor.nome).includes(q) : false)
      );
    });
  }, [pets, search, tutorById]);

  const openNew = () => {
    if (tutors.length === 0) {
      toast.info("Cadastre um tutor antes de adicionar um pet.");
      return;
    }
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Pets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pets.length} pet(s) sob os cuidados da clínica.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Novo Pet
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome do pet ou do tutor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Card className="shadow-soft">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Carregando pets...
          </CardContent>
        </Card>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pet) => {
            const tutor = tutorById(pet.tutorId);
            const meta = ESPECIE_META[pet.especie];
            return (
              <Card
                key={pet.id}
                className="shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start gap-3">
                    <PetAvatar pet={pet} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-extrabold leading-tight">{pet.nome}</p>
                      <p className="truncate text-sm text-muted-foreground">{pet.raca}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge className={`border-0 text-[11px] font-bold ${meta.chip}`}>
                          {pet.especie}
                        </Badge>
                        <Badge variant="secondary" className="text-[11px] font-bold">
                          {pet.porte}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] font-bold">
                          {SEXO_LABEL[pet.sexo]}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <User className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {pet.tutorNome ?? tutor?.nome ?? "Tutor não encontrado"}
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Cake className="size-3.5 shrink-0" />
                      {formatAge(pet.nascimento)}
                    </p>
                    {pet.observacoes && (
                      <p className="flex items-start gap-2 rounded-lg bg-accent/60 px-2.5 py-1.5 text-xs text-accent-foreground">
                        <Stethoscope className="mt-0.5 size-3.5 shrink-0" />
                        <span className="line-clamp-2">{pet.observacoes}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-1 border-t pt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setProntuarioPet(pet)}
                    >
                      <FileText className="size-4" /> Ver Prontuário
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(pet);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleting(pet)}
                    >
                      <Trash2 className="size-4" /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <PawPrint className="size-7 text-muted-foreground" />
            </span>
            <p className="font-extrabold">Nenhum pet encontrado</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {search
                ? "Tente ajustar o termo de busca pelo nome do pet ou do tutor."
                : "Clique em “Novo Pet” para cadastrar o primeiro paciente de quatro patas."}
            </p>
            {!search && (
              <Button className="mt-2" onClick={openNew}>
                <Plus className="size-4" /> Novo Pet
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <PetDialog open={dialogOpen} onOpenChange={setDialogOpen} pet={editing} />

      <ProntuarioPetDialog
        open={Boolean(prontuarioPet)}
        onOpenChange={(open) => !open && setProntuarioPet(null)}
        pet={prontuarioPet}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir ${deleting?.nome ?? "pet"}?`}
        description="Esta ação não pode ser desfeita. O cadastro do pet será removido permanentemente."
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deletePet(deleting.id);
            toast.success(`Pet "${deleting.nome}" excluído com sucesso.`);
            setDeleting(null);
          } catch {
            toast.error("Não foi possível excluir o pet. Tente novamente.");
          }
        }}
      />
    </div>
  );
}
